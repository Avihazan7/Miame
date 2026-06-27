export interface BigFiveProfile {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
}
export interface CognitiveProfile {
    cognitiveState: 'calm' | 'analytical' | 'social' | 'action' | 'focus';
    density: 'low' | 'medium' | 'high';
    animations: boolean;
    preferences: string[];
}
export declare function cognitiveProfile(p?: Partial<BigFiveProfile>, dealScore?: number): CognitiveProfile;
//# sourceMappingURL=bigfive.d.ts.map