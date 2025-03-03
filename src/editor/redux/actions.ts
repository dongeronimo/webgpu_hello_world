import { Action } from "redux";
import { Resolution } from "./types";
import { GameObject } from "../../engine/gameObject";

export const SET_RESOLUTION = 'set_resolution';
export const TOGGLE_GAME_OBJECT_ICON = 'toggle_game_object_icon'
export const SET_CURRENT_GAME_OBJECT = 'set_current_game_object'

export interface SetResolutionAction extends Action<typeof SET_RESOLUTION> {
    payload: Resolution;
}

export interface ToggleGameObjectIconAction extends Action<typeof TOGGLE_GAME_OBJECT_ICON> {
    payload: boolean
}

export interface SetCurrentGameObjectAction extends Action<typeof SET_CURRENT_GAME_OBJECT>{
    payload: number
}

export type AppActionTypes = SetResolutionAction | ToggleGameObjectIconAction | SetCurrentGameObjectAction;

export const changeResolution = (resolution: Resolution): SetResolutionAction => {
    return {
        type: SET_RESOLUTION,
        payload: resolution
    };
};

export const toggleGameObjectIcon = (v:boolean): ToggleGameObjectIconAction =>{
    return {
        type: TOGGLE_GAME_OBJECT_ICON,
        payload:v
    };
}

export const setCurrentGameObject = (go:number):SetCurrentGameObjectAction=>{
    return {
        type: SET_CURRENT_GAME_OBJECT,
        payload: go
    }
}