import { useEffect, useState } from "react";

function GameObjectName(props: {
    goName: string, 
    onNameChange: (newName:string) => void
}) {
    // Local state to track input value while user types
    const [localName, setLocalName] = useState(props.goName);
    // Update local state when prop changes (e.g., from parent)
    useEffect(() => {
        setLocalName(props.goName);
    }, [props.goName]);
    // Handle blur event to validate and update parent
    const handleBlur = () => {
        if (localName.trim() === '') {
            // If empty, revert to the original name
            setLocalName(props.goName);
        } else if (localName !== props.goName) {
            // If valid and changed, update parent
            props.onNameChange(localName);
        }
    };
    return(
        <div>
            <span>Name:</span>
            <input 
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={handleBlur}
                placeholder="Enter game object name"
            />
        </div>
    )
}

export default GameObjectName