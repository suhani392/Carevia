import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("[AI-Chat] Function script loaded.");

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization token." }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    );

    const token = authHeader.replace(/^[Bb]earer\s+/, "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid session." }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const { message, report_id } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required." }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const aiKey = Deno.env.get('GEMINI_API_KEY');
    if (!aiKey) {
      return new Response(JSON.stringify({ error: "AI configuration missing." }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const validId = (report_id && isUUID(report_id)) ? report_id : null;

    // Fetch prompts from database
    const { data: promptsData } = await supabase
      .from('system_prompts')
      .select('agent_name, prompt_template')
      .in('agent_name', ['ai_chat_general', 'ai_chat_report']);

    const generalPromptTpl = promptsData?.find((p: any) => p.agent_name === 'ai_chat_general')?.prompt_template 
      || "You are Carevia AI, a professional health assistant. Provide concise, expert-level help (around 100-150 words). Use **bold** for key medical terms and important values. Always end with: 'Note: I cannot provide medical diagnoses. Please consult a doctor for clinical advice.'";
      
    const reportPromptTpl = promptsData?.find((p: any) => p.agent_name === 'ai_chat_report')?.prompt_template 
      || "You are Carevia AI in Report Analysis mode. Use the provided **REPORT DATA** to answer accurately. Be professional, direct, and concise (max 2 short paragraphs). Highlight important values or findings in **bold**. Always include the medical disclaimer at the end.\n\nCONTEXT: {{CONTEXT_DATA}}\nUSER QUESTION: {{USER_QUESTION}}";

    let finalPrompt = "";

    if (validId) {
      const { data: struct } = await supabase
        .from('structured_reports')
        .select('parsed_json')
        .eq('report_id', validId)
        .maybeSingle();
      
      if (struct) {
        const contextData = `REPORT DATA: ${JSON.stringify(struct.parsed_json)}`;
        finalPrompt = reportPromptTpl
          .replace('{{CONTEXT_DATA}}', contextData)
          .replace('{{USER_QUESTION}}', message);
      } else {
        // Fallback to general if report data is missing
        finalPrompt = `${generalPromptTpl}\n\nUSER QUESTION: ${message}`;
      }
    } else {
        finalPrompt = `${generalPromptTpl}\n\nUSER QUESTION: ${message}`;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${aiKey}`;
    const aiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }],

        generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
      })
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: `AI Error: ${errBody.error?.message || aiRes.statusText}` }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502
      });
    }

    const result = await aiRes.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ text }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: `Server error: ${err.message}` }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

