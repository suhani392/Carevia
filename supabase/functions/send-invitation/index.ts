import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { record } = await req.json()

        const receiverEmail = record.receiver_email
        const senderId = record.sender_id

        if (!receiverEmail) {
            throw new Error('No receiver email found in the record')
        }

        // Initialize Supabase client inside the function to fetch sender details
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

        let senderName = "A family member"

        try {
            const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
            const supabase = createClient(supabaseUrl, supabaseAnonKey)

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', senderId)
                .single()

            if (profile?.full_name) {
                senderName = profile.full_name
            }
        } catch (e) {
            console.error('Error fetching sender profile:', e)
        }

        console.log(`Sending invitation from ${senderName} to ${receiverEmail}...`)

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Carevia <onboarding@resend.dev>',
                to: [receiverEmail],
                subject: `Family Invitation from ${senderName}`,
                html: `
          <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
              <div style="background-color: #0062FF; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Carevia</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin-top: 0;">Family Invitation</h2>
                <p>Hello,</p>
                <p><strong>${senderName}</strong> has invited you to join their family group on <strong>Carevia</strong>.</p>
                <p>Carevia helps families stay connected, share medical updates, and manage reports together in one secure place.</p>
                
                <div style="margin: 40px 0; text-align: center;">
                  <p style="margin-bottom: 20px; font-size: 14px; color: #666;">Sign up with this email to join the family:</p>
                  <p style="font-size: 18px; font-weight: bold; color: #0062FF; background: #ebf3ff; padding: 10px; display: inline-block; border-radius: 5px;">${receiverEmail}</p>
                </div>

                <p>Welcome to the family!</p>
                <p>Best regards,<br/>The Carevia Team</p>
              </div>
            </div>
          </div>
        `,
            }),
        })

        const data = await res.json()
        console.log('Resend response:', data)

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Error in send-invitation function:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
