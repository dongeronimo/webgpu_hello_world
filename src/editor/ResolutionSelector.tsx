
import React from 'react';
import { AppState, Resolution } from './redux/types';
import { changeResolution } from './redux/actions';
import { useAppDispatch, useAppSelector } from './redux/hooks';

function ResolutionSelector () {
    const resolution =  useAppSelector((state:AppState)=>state.resolution);
    const dispatch = useAppDispatch();
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>)=>{
        const numericValue = Number(event.target.value);
        dispatch(changeResolution(numericValue as Resolution));
    };

    const resolutionOptions = Object.keys(Resolution)
        .filter(key => isNaN(Number(key)))
        .map(key=> ({
            value: Resolution[key as keyof typeof Resolution],
            label: key.replace('_', '')
        }));
    return(
        <select id="selectChangeResolution" value={resolution} onChange={handleChange}>
            {resolutionOptions.map(option=>(
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    )
}
export default ResolutionSelector;