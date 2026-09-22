import { Blobatar } from "@blobatar/react";
import "blobatar/motion.css";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    name?: string;
    size?: number;
    className?: string;
    animate?: "hover" | "always";
}

export const UserAvatar = ({
    name,
    size = 64,
    className,
    animate = "always",
}: UserAvatarProps) => {
    // Pastikan seed tidak kosong agar Blobatar selalu dapat merender karakter unik yang konsisten
    const seed = (name && name.trim().length > 0) ? name.trim() : "mankeu";

    return (
        <div
            className={cn(
                "relative flex items-center justify-center overflow-hidden select-none shrink-0",
                className
            )}
            style={{ width: size, height: size }}
        >
            <Blobatar
                name={seed}
                size={size}
                animate={animate}
            />
        </div>
    );
};
