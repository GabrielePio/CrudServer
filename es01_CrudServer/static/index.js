"use strict"

// inizializzazione puntatori
const divIntestazione = document.getElementById("divIntestazione")
const divFilters = document.querySelector(".card")
const lstHair = document.getElementById("lstHair")
const divCollections =  document.getElementById("divCollections")
const table = document.getElementById("mainTable")
const thead = table.querySelector("thead")
const tbody = table.querySelector("tbody")
const divDettagli = document.getElementById("divDettagli")
const chkGender = divFilters.querySelectorAll("input[type='checkbox']")

// avvio
let currentCollection = "";
divFilters.style.display="none"
btnAdd.disabled = true;
btnUpdate.disabled = true;

chkGender[0].addEventListener("change", function(){
    chkGender[1].checked = false;
});

chkGender[1].addEventListener("change", function(){
    chkGender[0].checked = false;
});

getCollections();

async function getCollections(){
    const HttpResponse = await inviaRichiesta("GET", "/getCollections");
    if(HttpResponse.status == 200){
        let collections = HttpResponse.data;
        console.log(collections);
        const label = divCollections.querySelector("label");
        for(let collection of collections){
            const cloneLabel = label.cloneNode(true);
            cloneLabel.querySelector("span").textContent = collection.name;
            cloneLabel.querySelector("input[type='radio']")
            .addEventListener("click", function(){
                currentCollection = collection.name;
                btnAdd.disabled = false;
                btnUpdate.disabled = false;
                getData();
            });
            divCollections.appendChild(cloneLabel);
        }
        // rimuovo la label originale
        label.remove();
    }
    else{
        alert(HttpResponse.status + " : " + HttpResponse.err);
    }
}

async function getData(filters = {}){
    const HttpResponse = await inviaRichiesta("GET", `/${currentCollection}`, filters);
    if(HttpResponse.status == 200){
        console.log(HttpResponse.data);
        const strongs = divIntestazione.querySelectorAll("strong");
        strongs[0].textContent = currentCollection;
        strongs[1].textContent = HttpResponse.data.length;
        tbody.innerHTML = "";

        for(let item of HttpResponse.data){
            const tr = document.createElement("tr");
            tbody.append(tr);

            let td = document.createElement("td");
            td.addEventListener("click", function(){getCurrent(item._id)});
            td.textContent = item._id;
            tr.append(td);

            td = document.createElement("td");
            const secondKey = Object.keys(item)[1];
            // item.secondKey equivale a item["secondKey"]
            td.textContent = item[secondKey];
            tr.append(td);

            thead.querySelector("th:nth-of-type(2)").textContent = secondKey;

            td = document.createElement("td");
            // patch
            let div = document.createElement("div");
            div.addEventListener("click",  function(){
                patchCurrent(item._id);
            });
            td.append(div);
            // put
            div = document.createElement("div");
            div.addEventListener("click",  function(){
                putCurrent(item._id);
            });
            td.append(div);
            // delete
            div = document.createElement("div");
            div.addEventListener("click",  function(){
                deleteCurrent(item._id);
            });
            td.append(div);
            tr.append(td);
        }
        if(currentCollection == "unicorns"){
            divFilters.style.display=""
        }
        else{
            divFilters.style.display="none"
        }
    }
    else{
        alert(HttpResponse.status + " : " + HttpResponse.err);
    }
}

async function getCurrent(id){
    const HttpResponse = await inviaRichiesta("GET", `/${currentCollection}/${id}`);
    if(HttpResponse.status == 200){
        console.log(HttpResponse.data);
        let currentItem = HttpResponse.data;
        divDettagli.innerHTML = "";
        for(let key in currentItem){
            const strong = document.createElement("strong");
            strong.textContent = key + ": ";
            divDettagli.appendChild(strong);

            const span = document.createElement("span");
            span.textContent = JSON.stringify(currentItem[key]);
            divDettagli.appendChild(span);

            const br = document.createElement("br");
            divDettagli.appendChild(br);
        }
    }
    else{
        alert(HttpResponse.status + " : " + HttpResponse.err);
    }
}

btnFind.addEventListener("click", function(){
    getData(getFilters());
});

btnAdd.addEventListener("click", function(){
    divDettagli.innerHTML = "";
    const textArea = document.createElement("textarea");
    divDettagli.appendChild(textArea);
    textArea.style.height = 100 + "px";
    textArea.value = '{\n "name": "pippo",\n "example": "modify this"\n}';
    addTextAreaBtn("POST");
});

function addTextAreaBtn(method, id = ""){
    let btn = document.createElement("button");
    btn.textContent = "Salva";
    btn.classList.add("btn", "btn-success", "btn-sm");
    btn.style.margin = "10px";
    divDettagli.appendChild(btn);

    btn.addEventListener("click", async function(){
        let newRecord = divDettagli.querySelector("textarea").value;
        try{
            newRecord = JSON.parse(newRecord);
        }
        catch(err){
            alert("JSON non valido\n" + err);
            return;
        }

        let resource = `/${currentCollection}`;
        if(id)
            resource += `/${id}`;
        const HttpResponse = await inviaRichiesta(method, resource, newRecord);
        if(HttpResponse.status == 200){
            console.log(HttpResponse.data);
            alert("Operazione eseguita con successo");
            divDettagli.innerHTML = "";
            getData();
        }
        else{
            alert(HttpResponse.status + " : " + HttpResponse.err);
        }
    });

    btn = document.createElement("button");
    divDettagli.appendChild(btn);

    btn.textContent = "Annulla";
    btn.classList.add("btn", "btn-secondary", "btn-sm");
    btn.style.margin = "10px";
    btn.addEventListener("click", function(){
        divDettagli.innerHTML = "";
    });
}

async function deleteCurrent(id){
    if(confirm("Vuoi veramente cancellare il record " +  id + "?")){
        let resource = `/${currentCollection}/${id}`;
        let HttpResponse = await inviaRichiesta("DELETE", resource);
        if(HttpResponse.status == 200){
            console.log(HttpResponse.data);
            alert("Cancellazione avvenuta con successo");
            getData();
        }
        else{
            alert(HttpResponse.status + " : " + HttpResponse.err);
        }   
    }
}


btnDelete.addEventListener("click", async function(){
    let filters = getFilters();
    if(confirm("Vuoi veramente cancellare i record " + JSON.stringify(filters) + " ?")){
        let resource = `/${currentCollection}`;
        let HttpResponse = await inviaRichiesta("DELETE", resource, filters);
        if(HttpResponse.status == 200){
            console.log(HttpResponse.data);
            alert("Cancellazione avvenuta con successo" + HttpResponse.data.deletedCount);
            getData();
        }
        else{
            alert(HttpResponse.status + " : " + HttpResponse.err);
        }   
    }
});

function getFilters(){
    const hair = lstHair.value;
    let gender = "";
    const genderChecked = divFilters.querySelector("input[type='checkbox']:checked");

    if(genderChecked){
        gender = genderChecked.value;
    }
    let filters = {};
    if(hair != "All"){
        filters.hair = hair.toLowerCase();
    }

    if(gender){
        filters.gender = gender.toLowerCase();
    }

    return filters;
}

async function patchCurrent(id){
    let resource = `/${currentCollection}/${id}`;
    const HttpResponse = await inviaRichiesta("GET", resource);
    if(HttpResponse.status == 200){
        console.log(HttpResponse.data);
        divDettagli.innerHTML = "";
        let current = HttpResponse.data;
        // rimuove una chiave dal suo valore
        delete(current._id);
        const textArea = document.createElement("textarea");
        divDettagli.appendChild(textArea);
        textArea.style.height = 300 + "px";
        textArea.value = JSON.stringify(current, null, 2);
        addTextAreaBtn("PATCH", id);
    }
    else{
        alert(HttpResponse.status + " : " + HttpResponse.err);
    }
};

async function putCurrent(id){
    divDettagli.innerHTML = "";
    const textArea = document.createElement("textarea");
    divDettagli.appendChild(textArea);
    textArea.style.height = 100 + "px";
    textArea.value = '{\n "$inc": "pippo", "vampires": "2"\n}';
    addTextAreaBtn("PUT", id);
}

btnUpdate.addEventListener("click", function(){
    divDettagli.innerHTML = "";
    const textArea = document.createElement("textarea");
    divDettagli.appendChild(textArea);
    textArea.style.height = 200 + "px";
    textArea.value = '{\n "filter": { "gender":"m"},\n "action": \n{ "$inc": { "vampires": "2" }}\n}';
    addTextAreaBtn("PUT");
});