import React, { useState, useEffect, useRef, useReducer } from 'react';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { AppState } from './redux/types';
import TitleBar from './TitleBar';
import { GameManager } from '../core/gameManager';
import styles from "./styles.module.css";
import GameObjectEditor from './GameObjectEditor';

function GameObjectEditorPanel () {
    const selectedGameObjectId = useAppSelector( (state:AppState)=>state.selectedGameObject);
    const dispatch = useAppDispatch();
    const [position, setPosition] = useState({ top: 50, left: 50 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const divRef = useRef<HTMLDivElement>(null);
    const [, forceUpdate] = useReducer(x => x + 1, 0); //trick to force re-render 
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (divRef.current) {
        const rect = divRef.current.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        setIsDragging(true);
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          top: e.clientY - dragOffset.y,
          left: e.clientX - dragOffset.x
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    // Add and remove event listeners
    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      } else {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, dragOffset, handleMouseMove]); // Add handleMouseMove to dependencies

    useEffect(() => {
      if (selectedGameObjectId === 0) return;
      
      // Set up polling to check for changes
      const intervalId = setInterval(() => {
        forceUpdate(); // This will cause a re-render
      }, 100); // Adjust timing as needed for your game's performance
      
      return () => clearInterval(intervalId);
    }, [selectedGameObjectId]);

    const selectedGameObject = GameManager.getInstance().getGameObjects().find((v)=>v.id === selectedGameObjectId);

    if(selectedGameObjectId!=0){
        return (
          <div
            ref={divRef}
            style={{
              backgroundColor: 'aquamarine',
              position: 'absolute',
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 1000,
              cursor: isDragging ? 'grabbing' : 'grab',
              padding: '1px',
              border: '1px solid darkturquoise',
              userSelect: 'none'
            }}
            onMouseDown={handleMouseDown}
          >
            <div className={styles.componentPanelList}>
              <TitleBar title={selectedGameObject!.name}/>
              <GameObjectEditor go={selectedGameObject} />
            </div>
          </div>
        );
    }else {
        return(<div></div>)
    }
}

export default GameObjectEditorPanel;


