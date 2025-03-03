import { Action } from "redux";
import { Resolution } from "./types";

export const SET_RESOLUTION = 'set_resolution';
export const TOGGLE_GAME_OBJECT_ICON = 'toggle_game_object_icon'

export interface SetResolutionAction extends Action<typeof SET_RESOLUTION> {
    payload: Resolution;
}

export interface ToggleGameObjectIconAction extends Action<typeof TOGGLE_GAME_OBJECT_ICON> {
    payload: boolean
}

export type AppActionTypes = SetResolutionAction | ToggleGameObjectIconAction;

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