import { LiquidGlass } from "@liquidglass/react"

const GlassButton = ({ children, onClick, className }: { children: any, onClick: React.MouseEventHandler<HTMLButtonElement> | undefined, className?: string }) => {
    return <button type="button" onClick={onClick} className={`${className} glassbutton-parent`} style={{ border: "none" }}>
        <LiquidGlass className="glassbtn" saturation={5} blur={1}>
            {children}
        </LiquidGlass>
    </button>
}

export default GlassButton