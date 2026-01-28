function parseQueryString(req: any, res: any, next: any) {
    // con questa funzione andiamo a modificare req.query parsificandolo ogni valore
    req["parsedQuery"] = {};
    if(req["query"] && typeof req["query"] == 'object'){
        for(const key in req["query"]){
            const value = req["query"][key];
            req["parsedQuery"][key] = parseValue(value);
        }
    }
    next();
}

function parseValue(value: any){
    if(value == 'true')
        return true;
    if(value == 'false')
        return false;

    // Number è simile a parseInt, ma funziona anche quando
    // viene scritta una lettera scrivendo NaN e con i decimali
    // typeof NaN restituisce number, mentre parseInt restituisce NaN
    const num = Number(value);
    if(!isNaN(num))
        return num;

    if(typeof value == 'string' && (value.startsWith('[') || value.startsWith('{'))){
        try {
            return JSON.parse(value);
        } catch (err) {
            return value;
        }
    }

    // se è una stringa la lasciamo così com'è
    return value;
}

export default parseQueryString;