import { useCallback } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { ArticleFormValues } from '../schemas/formSchema';
import { SavedProfile } from '../types';

interface ProfileManagerParams {
    savedProfiles?: SavedProfile[];
    setSavedProfiles?: (profiles: SavedProfile[]) => void;
    activeProfile?: SavedProfile | null;
    onSetActiveProfile?: (profile: SavedProfile | null) => void;
    brandKnowledge?: string;
    setValue: UseFormSetValue<ArticleFormValues>;
}

export const useProfileManager = ({
    savedProfiles = [],
    setSavedProfiles,
    activeProfile,
    onSetActiveProfile,
    brandKnowledge,
    setValue,
}: ProfileManagerParams) => {

    const createProfile = useCallback((name: string, values: ArticleFormValues) => {
        if (!setSavedProfiles || !name.trim()) return null;

        const newProfile: SavedProfile = {
            id: Date.now().toString(),
            name: name.trim(),
            websiteType: values.websiteType || '',
            authorityTerms: values.authorityTerms || '',
            brandKnowledge: brandKnowledge || '',
            targetAudience: values.targetAudience,
            productRawText: values.productRawText
        };

        const updated = [...savedProfiles, newProfile];
        setSavedProfiles(updated);
        onSetActiveProfile?.(newProfile);
        return newProfile;
    }, [brandKnowledge, onSetActiveProfile, savedProfiles, setSavedProfiles]);

    const updateProfile = useCallback((values: ArticleFormValues) => {
        if (!setSavedProfiles || !activeProfile) return null;

        const updatedProfiles = savedProfiles.map(p => p.id === activeProfile.id ? {
            ...p,
            websiteType: values.websiteType || '',
            authorityTerms: values.authorityTerms || '',
            targetAudience: values.targetAudience,
            productRawText: values.productRawText,
            brandKnowledge: brandKnowledge
        } : p);

        setSavedProfiles(updatedProfiles);
        const updatedActive = updatedProfiles.find(p => p.id === activeProfile.id) || null;
        onSetActiveProfile?.(updatedActive);
        return updatedActive;
    }, [activeProfile, brandKnowledge, onSetActiveProfile, savedProfiles, setSavedProfiles]);

    const deleteProfile = useCallback((id: string) => {
        if (!setSavedProfiles) return;
        const updatedProfiles = savedProfiles.filter(p => p.id !== id);
        setSavedProfiles(updatedProfiles);
        if (activeProfile?.id === id) {
            onSetActiveProfile?.(null);
        }
    }, [activeProfile?.id, onSetActiveProfile, savedProfiles, setSavedProfiles]);

    const applyProfileToForm = useCallback((profile: SavedProfile) => {
        setValue('websiteType', profile.websiteType);
        setValue('authorityTerms', profile.authorityTerms);
        setValue('targetAudience', profile.targetAudience);

        if (profile.productRawText) {
            setValue('productRawText', profile.productRawText);
        } else if (profile.productBrief) {
            setValue('productRawText', `${profile.productBrief.productName} - ${profile.productBrief.usp}. Link: ${profile.productBrief.ctaLink}`);
        }

        onSetActiveProfile?.(profile);
    }, [onSetActiveProfile, setValue]);

    const loadProductFromProfile = useCallback((profile: SavedProfile) => {
        if (profile.productRawText) {
            setValue('productRawText', profile.productRawText);
        } else if (profile.productBrief) {
            setValue('productRawText', `${profile.productBrief.productName} - ${profile.productBrief.usp}. Link: ${profile.productBrief.ctaLink}`);
        } else {
            alert('This profile has no saved product/service details.');
        }
    }, [setValue]);

    return {
        createProfile,
        updateProfile,
        deleteProfile,
        applyProfileToForm,
        loadProductFromProfile,
    };
};
