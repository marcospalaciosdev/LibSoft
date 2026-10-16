import { Button, Modal } from "@/shared/components/ui";
import { useTranslation } from "react-i18next";
import { firstCap } from "@/shared/utils/firstCap";

interface ConfirmDeleteCopyModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDeleteCopyModal({ isOpen, onConfirm, onCancel }: ConfirmDeleteCopyModalProps) {

    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onCancel}>
            <div className="w-full bg-[rgb(var(--color-bg))] flex flex-col items-center p-8 rounded-2xl relative">
                <span className="absolute top-4 right-4 material-symbols-outlined text-[rgb(var(--color-text-muted))]/50 cursor-pointer hover:text-[rgb(var(--color-text))] transition-colors duration-200 text-(length:--fs-icon-md)" onClick={onCancel}>close</span>
                <div className="mt-4 mb-8 relative">
                    <div className="absolute inset-0 bg-[rgb(var(--color-error-500))]/10 rounded-full scale-150 animate-pulse"></div>
                    <div className="relative bg-[rgb(var(--color-error-500))]/20 p-5 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[rgb(var(--color-error-500))] text-5xl select-none">
                            delete_forever
                        </span>
                    </div>
                </div>

                <h2 className="text-[rgb(var(--color-text))] text-2xl font-bold mb-3 text-center tracking-tight">
                    {firstCap(t('common.areYouSure'))}
                </h2>
                <p className="text-[rgb(var(--color-text-muted))]/80 text-sm text-center leading-relaxed w-[90%]">
                    {firstCap(t('books.manage.inventory.deleteConfirm'))}
                </p>
                <div className="mt-8 flex w-full gap-3">
                    <Button
                        variant="ghost"
                        className="w-full h-12 rounded-xl font-semibold text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-surface))]/50 hover:bg-[rgb(var(--color-surface))] hover:text-[rgb(var(--color-text))] transition-colors"
                        onClick={onCancel}
                    >
                        {firstCap(t('common.actions.cancel'))}
                    </Button>
                    <Button
                        variant="default"
                        className="w-full h-12 rounded-xl font-bold bg-red-600/80 text-white hover:bg-red-600 hover:text-white shadow-[rgb(var(--color-error-500))]/20 transition-all duration-200 transform active:scale-[0.98]"
                        onClick={onConfirm}
                    >
                        {firstCap(t('common.actions.delete'))}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}