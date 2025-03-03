import { GameObject } from "../../engine/gameObject";

export enum Resolution {
    _800x600,
    _1024x768
};

export interface AppState {
    resolution: Resolution;
    showGameObjectIcon: boolean;
    selectedGameObject: number;
}