
import React, { ChangeEvent, useEffect, useState } from 'react';
import styles from "./styles.module.css";
import { EditorController } from './EditorController';
function SceneIconToggle() {
  const [checkedItems, setCheckedItems] = useState({
    gameObjectIcon: true,
  });
  
  const handleChange = (event:ChangeEvent<HTMLInputElement>) => {
    setCheckedItems({
      ...checkedItems,
      [event.target.name]: event.target.checked
    });

  };
  useEffect(() => {
    if(checkedItems.gameObjectIcon == true){
        EditorController.editorInstance?.setGameObjectIconToggle(true);
    }else {
        EditorController.editorInstance?.setGameObjectIconToggle(false);
    }
  }, [checkedItems.gameObjectIcon]);
  return (
    <div className={styles.iconsTogglePanel}>
      <span>icons:</span>  
      <div className={styles.iconsToggleList}>
        <label>
          <input 
            type="checkbox" 
            name="gameObjectIcon" 
            checked={checkedItems.gameObjectIcon} 
            onChange={handleChange} 
          />
          GameObject
        </label>
      </div>
    </div>
  );
}
export default SceneIconToggle;