export const AVATAR_MAP: Record<string, any> = {
    'baby-boy.png': require('../assets/avatars/baby-boy.png'),
    'baby-girl.png': require('../assets/avatars/baby-girl.png'),
    'small-boy.png': require('../assets/avatars/small-boy.png'),
    'small-girl.png': require('../assets/avatars/small-girl.png'),
    'young-boy.png': require('../assets/avatars/young-boy.png'),
    'young-girl.png': require('../assets/avatars/young-girl.png'),
    'man.png': require('../assets/avatars/man.png'),
    'woman.png': require('../assets/avatars/woman.png'),
    'old-man.png': require('../assets/avatars/old-man.png'),
    'old-woman.png': require('../assets/avatars/old-woman.png'),
    'dog': require('../assets/avatars/dog.png'),
    'cat': require('../assets/avatars/cat.png')
};

export const getAvatarSource = (photoUrl: string | null | undefined) => {
    if (!photoUrl) return null;

    // Check if it's one of our local avatars
    if (AVATAR_MAP[photoUrl]) {
        return AVATAR_MAP[photoUrl];
    }

    // Check if it's a URL (Dicebear or other)
    if (photoUrl.startsWith('http')) {
        return { uri: photoUrl };
    }

    // Fallback or potentially a filename from a bucket (not handled here yet)
    return null;
};

export const APP_AVATAR_LIST = Object.keys(AVATAR_MAP);
