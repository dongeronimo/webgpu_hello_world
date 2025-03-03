import { Action } from "redux";
import { Resolution } from "./types";

export const SET_RESOLUTION = 'set_resolution';

export interface SetResolutionAction extends Action<typeof SET_RESOLUTION> {
    payload: Resolution;
}

export type AppActionTypes = SetResolutionAction;

export const changeResolution = (resolution: Resolution): SetResolutionAction => {
    return {
        type: SET_RESOLUTION,
        payload: resolution
    };
};