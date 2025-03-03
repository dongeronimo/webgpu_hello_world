import { AppActionTypes, SET_RESOLUTION, TOGGLE_GAME_OBJECT_ICON } from "./actions";
import { AppState, Resolution } from "./types";

const intitialState: AppState = {
    resolution: Resolution._1024x768,
    showGameObjectIcon: true,
}

const appReducer = (state = intitialState, action:AppActionTypes):AppState =>
{
    let newState:AppState;
    switch(action.type){
        case SET_RESOLUTION: 
            newState =  {
                ...state,
                resolution: action.payload
            }
            break;
        case TOGGLE_GAME_OBJECT_ICON:
            newState = {
                ...state,
                showGameObjectIcon: action.payload
            }
            break;
        default:
            newState = { ...state };
    }
    console.log(newState);
    return newState;        
}

export default appReducer;