import { APP_NAME } from "@/shared/constants";

export function BorrowerReceiptTemplate() {

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-[rgb(var(--color-bg-secondary))]">
            <div className="w-[595px] flex items-center bg-white p-10">
                <header>
                    <div className="flex flex-row">
                        <h2 className="font-semibold">
                            {APP_NAME}
                        </h2>
                        <span className="mx-2">|</span>
                        <h2>
                            Borrower Receipt Template
                        </h2>
                    </div>
                </header>
            </div>
        </div>
    )
}