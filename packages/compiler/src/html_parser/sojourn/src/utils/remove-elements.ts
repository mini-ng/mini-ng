import {Token} from "../types/types";

/**
 * This function removes elements in an array starting from a specified index to an end index.
 * @param start The index to start removing/deleting elements from.
 * @param end The end index to stop.
 * @param array
 */
export function removeElements(start: number, end: number, array: Array<any>) {
    const newArray = [];

    for (let i = 0; i < array.length; i++) {
        const el = array[i]

        if(i === end || i === start || (i > start && i < end)) {
            continue
        }

        newArray.push(el)
    }

    return newArray
}
