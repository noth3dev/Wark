export const TAG_VARIANTS = [
    { icon: 'Cpu', color: '#22d3ee', label: 'Computing' },
    { icon: 'Moon', color: '#818cf8', label: 'Night/Rest' },
    { icon: 'Sun', color: '#fbbf24', label: 'Morning/Vitality' },
    { icon: 'Book', color: '#c084fc', label: 'Study/Reading' },
    { icon: 'Code', color: '#f472b6', label: 'Development' },
    { icon: 'Coffee', color: '#fb923c', label: 'Break/Coffee' },
    { icon: 'Gamepad2', color: '#fb7185', label: 'Gaming/Leisure' },
    { icon: 'Music', color: '#a3e635', label: 'Music/Focus' },
    { icon: 'Dumbbell', color: '#4ade80', label: 'Exercise' },
    { icon: 'Briefcase', color: '#2dd4bf', label: 'Work/Business' },
    { icon: 'Heart', color: '#ef4444', label: 'Life/Health' },
    { icon: 'Star', color: '#ffffff', label: 'Important' },
    { icon: 'Camera', color: '#94a3b8', label: 'Creative' }
] as const;

export type TagIconName = typeof TAG_VARIANTS[number]['icon'];

export function getTagColor(iconName?: string) {
    const variant = TAG_VARIANTS.find(v => v.icon === iconName);
    return variant?.color || '#22d3ee';
}
