import { Button } from "../ui";
import { VscChromeMinimize, VscChromeMaximize, VscChromeClose } from 'react-icons/vsc';

import { LibsoftLogotype } from "../brand/LibsoftLogotype";
import { LibsoftIsotype } from "../brand/LibsoftIsotype";

export function Header() {

  const handleMinimize = () => window.electronAPI.minimizeWindow();
  const handleMaximize = () => window.electronAPI.maximizeWindow();
  const handleClose = () => window.electronAPI.closeWindow();

  return (
    <div className="h-11 w-full bg-[rgb(var(--color-bg))] shadow-sm z-9999 relative flex flex-row justify-between [-webkit-app-region:drag]">
      <div className="flex-1 flex flex-row items-center h-full">
        <div className="h-full flex flex-row items-center gap-2 pl-2">
          <LibsoftLogotype sizeInPx={27} />
          <LibsoftIsotype fontSizeInPx={13} color='rgb(var(--color-text))' />
        </div>
      </div>
      <div className="h-full overflow-hidden flex flex-row [-webkit-app-region:no-drag]">
        <Button
          onClick={handleMinimize}
          variant="ghost"
          className="w-12 h-full rounded-none flex items-center justify-center relative"
        >
          <VscChromeMinimize
            className="absolute"
            size={16}
          />
        </Button>
        <Button
          onClick={handleMaximize}
          variant="ghost"
          className="w-12 h-full rounded-none flex items-center justify-center relative"
        >
          <VscChromeMaximize
            className="absolute"
            size={13} />
        </Button>
        <Button
          onClick={handleClose}
          variant="ghost"
          className="w-12 h-full rounded-none flex items-center justify-center relative hover:bg-red-500 hover:text-white"
        >
          <VscChromeClose
            className="absolute"
            size={15}
          />
        </Button>

      </div>
    </div>
  );
}
