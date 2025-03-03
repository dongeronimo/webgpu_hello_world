import { GameObject } from "../engine/gameObject";

export class GameManager {
    private static instance:GameManager|null = null;
    private gameObjects:Array<GameObject>=[];
    public static getInstance():GameManager{
        if(this.instance == null){
            this.instance = new GameManager();
        } 
        return this.instance;
    }
    public getGameObjects():Array<GameObject>{
        return this.gameObjects;
    }
}