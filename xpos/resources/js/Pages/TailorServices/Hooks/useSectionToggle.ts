import { useState, useCallback } from 'react';

export const useSectionToggle = (initialSections: string[] = []) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(initialSections)
    );

    const toggleSection = useCallback((sectionId: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    }, []);

    const isSectionExpanded = useCallback((sectionId: string) => {
        return expandedSections.has(sectionId);
    }, [expandedSections]);

    const expandSection = useCallback((sectionId: string) => {
        setExpandedSections(prev => new Set([...prev, sectionId]));
    }, []);

    const collapseSection = useCallback((sectionId: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            newSet.delete(sectionId);
            return newSet;
        });
    }, []);

    return {
        expandedSections,
        toggleSection,
        isSectionExpanded,
        expandSection,
        collapseSection
    };
};