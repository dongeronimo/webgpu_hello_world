
import React, { ChangeEvent, useEffect, useState } from 'react';
import styles from "./styles.module.css";
import { EditorController } from './EditorController';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { AppState } from './redux/types';
import { toggleGameObjectIcon } from './redux/actions';
function SceneIconToggle() {
  const showGameObjectIcon = useAppSelector((state:AppState)=>state.showGameObjectIcon);
  const dispatch = useAppDispatch();
  
  const gameObjectIconChange = (event:ChangeEvent<HTMLInputElement>) => {
    const value = Boolean(event.target.checked);
    dispatch(toggleGameObjectIcon(value));
  };

  return (
    <div className={styles.iconsTogglePanel}>
      <span>icons:</span>  
      <div className={styles.iconsToggleList}>
        <label>
          <input 
            type="checkbox" 
            name="gameObjectIcon" 
            checked={showGameObjectIcon} 
            onChange={gameObjectIconChange} 
          />
          GameObject
        </label>
      </div>
    </div>
  );
}
export default SceneIconToggle;