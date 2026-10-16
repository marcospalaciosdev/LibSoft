import { useState, useEffect } from 'react';
import { firstCap } from "@/shared/utils/firstCap"
import { useTranslation } from "react-i18next"
import { SearchBar, Button, Spinner } from '@/shared/components/ui';
import { helpApi } from '../api/help.api';

import { HelpText } from '../utils/HelpText';
import type { DataStatus } from '@LibSoft/shared-types';

const FEATURED_FAQ_CODES: string[] = [
    'faq_loans_how_to_return',
    'faq_books_how_to_add_or_delete_copy',
    'faq_loans_history'
];

interface Topic {
    id: string;
    category: string;
    label: string;
    description: string;
    icon: string;
}

interface FAQ {
    id: string;
    question: string;
    answer: string;
}

export function HelpPage() {
    const { t, i18n } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");
    const topics = (t('help.topics', { returnObjects: true }) as Topic[]) || [];

    const [featuredFaqs, setFeaturedFaqs] = useState<FAQ[]>([]);
    const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);

    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

    const [FAQSSuggestionsStatus, setFAQSSuggestionsStatus] = useState<DataStatus | 'empty'>('idle');
    const [featuredFAQSStatus, setFeaturedFAQSStatus] = useState<DataStatus | 'empty'>('idle');

    const fetchFaqs = async () => {
        try {
            setFAQSSuggestionsStatus('loading');
            const data = await helpApi.getFaqsByLanguage(
                i18n.language,
                searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(),
                5
            );
            setFilteredFaqs(data);

            if (data.length === 0) setFAQSSuggestionsStatus('empty')
            else setFAQSSuggestionsStatus('success');

        } catch (error) {
            console.error("Error al obtener las FAQS:", error);
            setFAQSSuggestionsStatus('error');
        }
    }

    const fetchFaqsByCodes = async (codes: string[], language: string) => {
        try {
            setFeaturedFAQSStatus('loading');
            const data = await helpApi.getFaqsByCodes(codes, language);
            console.log(data);
            setFeaturedFaqs(data);

            if (data.length === 0) setFeaturedFAQSStatus('empty');
            else setFeaturedFAQSStatus('success');

        } catch (error) {
            console.error("Error al obtener las FAQS:", error);
        }
    }

    useEffect(() => { fetchFaqs() }, [searchTerm]);
    useEffect(() => { fetchFaqsByCodes(FEATURED_FAQ_CODES, i18n.language) }, [i18n.language]);

    return (
        <div className="w-full h-full mx-auto relative animate-fade-in">
            <div className='px-32 p-12 w-full h-full absolute z-10 overflow-y-auto'>
                <div className="w-full flex flex-col justify-center items-center gap-2 text-center mb-16">
                    <h1 className="text-3xl font-extrabold text-[rgb(var(--color-text))] tracking-tight">
                        {firstCap(t('help.title'))}
                    </h1>
                    <p className="text-[rgb(var(--color-text-muted))] text-sm max-w-lg">
                        {firstCap(t('help.subtitle'))}
                    </p>
                    <div className="w-full max-w-2xl mt-8 relative">
                        <SearchBar
                            placeholder={firstCap(t('help.faqs.searchPlaceholder'))}
                            onChange={(e) => setSearchTerm(e)}
                            className="overflow-hidden py-3.5 px-5 h-fit! w-full border-transparent bg-[rgb(var(--color-bg-tertiary))] rounded-full shadow-inner focus-within:ring-2 focus-within:ring-[rgb(var(--color-primary-500))]/30 transition-all"
                        />
                        {((searchTerm && searchTerm.trim() !== '')) && (
                            <div className="absolute z-10 w-full mt-2 bg-[rgb(var(--color-bg))] shadow-lg rounded-xl border border-[rgb(var(--color-border))]/40 overflow-hidden">

                                {FAQSSuggestionsStatus === 'loading' ? (
                                    <div className="w-full py-8 flex flex-col items-center justify-center gap-3 bg-[rgb(var(--color-bg))]">
                                        <Spinner />
                                        <span className="text-xs font-medium text-[rgb(var(--color-text-muted))]">
                                            {firstCap(t('help.faqs.searching'))}
                                        </span>
                                    </div>
                                ) : FAQSSuggestionsStatus === 'error' ? (
                                    <div className="w-full py-8 flex flex-col items-center justify-center gap-2 text-center px-4 bg-[rgb(var(--color-bg))]">
                                        <span className="material-symbols-outlined text-[rgb(var(--color-text-soft))] text-3xl select-none">
                                            error
                                        </span>
                                        <h3 className="text-sm font-medium text-[rgb(var(--color-text-muted))] mb-2">
                                            {firstCap(t('common.errorMessages.failedToLoad'))}
                                        </h3>
                                        <Button
                                            variant='primary'
                                            onClick={() => fetchFaqs()}
                                            className='text-(length:--fs-caption) px-3 py-2 rounded-md gap-1.5!'
                                            leftIcon={
                                                <span className="material-symbols-outlined text-(length:--fs-icon-md) select-none">
                                                    refresh
                                                </span>
                                            }
                                        >
                                            {firstCap(t('common.actions.retry'))}
                                        </Button>
                                    </div>
                                ) : FAQSSuggestionsStatus === 'success' ? (
                                    <div className="divide-y divide-[rgb(var(--color-border))]/20">
                                        {filteredFaqs.map((faq) => {
                                            const isExpanded = expandedFaq === faq.id;
                                            return (
                                                <div
                                                    key={faq.id}
                                                    className="w-full bg-[rgb(var(--color-bg))] overflow-hidden transition-colors"
                                                >
                                                    <button
                                                        onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                                                        className="w-full py-4 px-6 text-left flex justify-between items-center hover:bg-[rgb(var(--color-bg-hover))]/50 transition-colors focus:outline-none cursor-pointer group"
                                                    >
                                                        <span className={`font-semibold text-sm transition-colors ${isExpanded ? 'text-[rgb(var(--color-primary-500))]' : 'text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary-500))]'}`}>
                                                            {faq.question}
                                                        </span>
                                                        <span className={`material-symbols-outlined text-[rgb(var(--color-text-soft))] transition-transform duration-300 select-none shrink-0 ${isExpanded ? 'rotate-180 text-[rgb(var(--color-primary-500))]' : ''}`}>
                                                            expand_more
                                                        </span>
                                                    </button>

                                                    <div
                                                        className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-75 border-t border-[rgb(var(--color-border))]/20' : 'max-h-0'
                                                            }`}
                                                    >
                                                        <div className="p-6 text-xs text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-bg-secondary))]/20 leading-relaxed text-left">
                                                            <HelpText text={faq.answer} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : FAQSSuggestionsStatus === 'empty' ? (
                                    <div className="w-full py-8 flex flex-col items-center justify-center gap-2 text-center px-4 bg-[rgb(var(--color-bg))]">
                                        <span className="material-symbols-outlined text-[rgb(var(--color-text-soft))] text-3xl select-none">
                                            search_off
                                        </span>
                                        <div className="text-xs font-semibold text-[rgb(var(--color-text))]">
                                            {firstCap(t('help.faqs.noResults.title'))}
                                        </div>
                                        <div className="text-[11px] text-[rgb(var(--color-text-muted))]">
                                            {firstCap(t('help.faqs.noResults.subtitle'))} <span className="italic font-medium">"{searchTerm}"</span>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
                <section className='relative z-9'>
                    {topics.length > 0 &&
                        <div className="flex flex-row flex-wrap justify-center gap-6">
                            {topics.map((topic) => (
                                <div
                                    key={topic.id}
                                    className="py-6 px-7 w-60 rounded-2xl bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))]/30 hover:border-[rgb(var(--color-primary-500))]/40 shadow-lg transition-all duration-300 flex flex-col items-start gap-4 hover:shadow-md hover:translate-y-1.5 group"
                                >
                                    <div className="p-2.5 aspect-square rounded-md bg-[rgb(var(--color-primary-500))]/10 text-[rgb(var(--color-primary-500))] group-hover:bg-[rgb(var(--color-primary-500))]/20 transition-colors flex items-center justify-center">
                                        <span className="material-symbols-outlined select-none block text-xl">
                                            {topic.icon}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-sm text-[rgb(var(--color-text))]">
                                        {topic.label}
                                    </h3>
                                    <p className="text-xs text-[rgb(var(--color-text-muted))] leading-relaxed">
                                        <HelpText text={topic.description} />
                                    </p>
                                </div>
                            ))}
                        </div>
                    }
                </section>

                <section className="mt-20">
                    {featuredFAQSStatus === 'loading' ? (
                        <Spinner
                            color='rgb(var(--color-primary-500))'
                        />
                    ) : featuredFAQSStatus === 'success' ? (
                        <>
                            <h2 className="text-3xl font-bold text-[rgb(var(--color-text-muted))] mb-12 w-full text-center">
                                {firstCap(t('help.faqs.title'))}
                            </h2>
                            <div className="flex flex-col items-center gap-4">
                                {featuredFaqs.map((faq) => {
                                    const isExpanded = expandedFaq === faq.id;
                                    return (
                                        <div
                                            key={faq.id}
                                            className="w-full max-w-3xl bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))]/30 rounded-md overflow-hidden shadow-md"
                                        >
                                            <button
                                                onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                                                className="w-full py-4 px-6 text-left flex justify-between items-center hover:bg-[rgb(var(--color-bg-hover))]/50 transition-colors focus:outline-none cursor-pointer"
                                            >
                                                <span className="font-semibold text-sm text-[rgb(var(--color-text))]">
                                                    {faq.question}
                                                </span>
                                                <span className={`material-symbols-outlined text-[rgb(var(--color-text-muted))] transition-transform duration-300 select-none shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                                                    expand_more
                                                </span>
                                            </button>
                                            <div
                                                className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-50 border-t border-[rgb(var(--color-border))]/20' : 'max-h-0'
                                                    }`}
                                            >
                                                <div className="p-6 text-xs text-[rgb(var(--color-text-muted))] leading-relaxed text-left">
                                                    <HelpText text={faq.answer} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : null}
                </section>

                <div className="mx-auto bg-[rgb(var(--color-bg-tertiary))] shadow-lg flex flex-col items-center py-10 mt-20 w-fit rounded-lg px-16">
                    <h1 className="text-2xl font-bold text-[rgb(var(--color-text-muted))] w-full text-center">
                        {firstCap(t('help.footer.support.title'))}
                    </h1>
                    <span className="w-112.5 text-center text-sm mt-6 text-[rgb(var(--color-text-muted))]">
                        {firstCap(t('help.footer.support.subtitle'))}
                    </span>
                    <Button variant="primary" className="mt-6 rounded-md">
                        <span>{firstCap(t('help.footer.support.button'))}</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}