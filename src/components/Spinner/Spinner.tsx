import "./Spinner.css";

interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    variant?: "primary" | "light" | "dark";
    text?: string;
    inline?: boolean;
}

export const Spinner = ({ size = "md", variant = "primary", text, inline = false }: SpinnerProps) => {
    const sizeClass = `spinner-${size}`;
    const variantClass = `spinner-${variant}`;

    if (inline) {
        return (
            <span className="spinner-inline">
                <span className={`spinner ${sizeClass} ${variantClass}`}></span>
                {text && <span className="spinner-text">{text}</span>}
            </span>
        );
    }

    return (
        <div className="spinner-container">
            <span className={`spinner ${sizeClass} ${variantClass}`}></span>
            {text && <p className="spinner-text">{text}</p>}
        </div>
    );
};
