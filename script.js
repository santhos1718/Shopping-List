const STORAGE_MASTER = "shop_quick_master_en";
const STORAGE_SHOP = "shop_quick_shopping_en";

// DOM
const searchInput = document.getElementById("searchInput");
const qtyInput = document.getElementById("qtyInput");
const suggestionsEl = document.getElementById("suggestions");
const addSelectedBtn = document.getElementById("addSelectedBtn");
const shoppingListEl = document.getElementById("shoppingList");
const totalCountEl = document.getElementById("totalCount");
const printBtn = document.getElementById("printBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const clearListBtn = document.getElementById("clearListBtn");

const masterListEl = document.getElementById("masterList");
const newMasterItemInput = document.getElementById("newMasterItem");
const addMasterBtn = document.getElementById("addMasterBtn");
const bulkImportArea = document.getElementById("bulkImportArea");
const bulkImportBtn = document.getElementById("bulkImportBtn");

// Load Master
function loadMaster(){
  const raw = localStorage.getItem(STORAGE_MASTER);
  if(raw) return JSON.parse(raw);
  try{
    const initial = JSON.parse(document.getElementById("initial-items").textContent);
    localStorage.setItem(STORAGE_MASTER, JSON.stringify(initial));
    return initial;
  }catch(e){ return []; }
}

let masterItems = loadMaster();
let shoppingItems = JSON.parse(localStorage.getItem(STORAGE_SHOP)||"[]");

function saveMaster(){ localStorage.setItem(STORAGE_MASTER, JSON.stringify(masterItems)); renderMaster();}
function saveShopping(){ localStorage.setItem(STORAGE_SHOP, JSON.stringify(shoppingItems)); renderShopping(); }
function normalize(s){ return (s||"").toString().trim().toLowerCase(); }

// Render Master
function renderMaster(){
  masterListEl.innerHTML="";
  masterItems.forEach((m,idx)=>{
    const li=document.createElement("li");
    li.innerHTML=`<div>${m}</div>
      <div>
        <button class="small-btn" onclick="addMasterToShopping(${idx})">Add</button>
        <button class="small-btn" style="border-color:#ff6b6b;color:#ff6b6b" onclick="removeMaster(${idx})">Delete</button>
      </div>`;
    masterListEl.appendChild(li);
  });
}

window.addMasterToShopping = function(idx){ addToShopping(masterItems[idx],1); }
window.removeMaster = function(idx){ if(!confirm("Delete this master item?")) return; masterItems.splice(idx,1); saveMaster(); }

// Render Shopping with text input for quantity
function renderShopping(){
  shoppingListEl.innerHTML="";
  shoppingItems.forEach((it,idx)=>{
    const li=document.createElement("li");
    li.innerHTML=`<div class="item-left"><div class="item-name">${it.name}</div></div>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="text" class="qty-input" value="${it.qty}" onchange="updateQty(${idx}, this.value)" />
        <button class="small-btn" style="border-color:#ef4444;color:#ef4444" onclick="removeFromShopping(${idx})">Delete</button>
      </div>`;
    shoppingListEl.appendChild(li);
  });
  totalCountEl.textContent = shoppingItems.length;
}

function addToShopping(name, qty){
  name=name.trim(); if(!name) return;
  const existing=shoppingItems.find(i=>normalize(i.name)===normalize(name));
  if(existing) existing.qty+=qty; else shoppingItems.push({name, qty});
  saveShopping();
}

window.updateQty = function(idx,value){
  let v = parseInt(value);
  if(isNaN(v) || v <1) v=1;
  shoppingItems[idx].qty=v;
  saveShopping();
}

window.removeFromShopping = function(idx){ shoppingItems.splice(idx,1); saveShopping(); }

// Autocomplete
let currentSuggestions=[],activeIndex=-1;
function showSuggestions(list){
  suggestionsEl.innerHTML=""; currentSuggestions=list; activeIndex=-1;
  if(!list.length){ suggestionsEl.style.display="none"; return; }
  suggestionsEl.style.display="block";
  list.forEach((txt,i)=>{
    const li=document.createElement("li");
    li.textContent=txt;
    li.addEventListener("click",()=>{ addToShopping(txt,parseInt(qtyInput.value||1)); searchInput.value=""; suggestionsEl.style.display="none"; searchInput.focus(); });
    suggestionsEl.appendChild(li);
  });
}
function updateSuggestions(){
  const q=normalize(searchInput.value);
  if(!q){ suggestionsEl.style.display="none"; return; }
  const filtered=masterItems.filter(m=>normalize(m).includes(q));
  showSuggestions(filtered.slice(0,40));
}

searchInput.addEventListener("keydown",(e)=>{
  const items=suggestionsEl.querySelectorAll("li");
  if(e.key==="ArrowDown"){ e.preventDefault(); activeIndex=Math.min(activeIndex+1,items.length-1); updateActive(items);}
  else if(e.key==="ArrowUp"){ e.preventDefault(); activeIndex=Math.max(activeIndex-1,0); updateActive(items);}
  else if(e.key==="Enter"){ e.preventDefault();
    if(items.length && activeIndex>=0 && items[activeIndex]) addToShopping(items[activeIndex].textContent,parseInt(qtyInput.value||1));
    else if(searchInput.value.trim()) addToShopping(searchInput.value.trim(),parseInt(qtyInput.value||1));
    searchInput.value=""; suggestionsEl.style.display="none";
  } else if(e.key==="Escape"){ suggestionsEl.style.display="none"; }
});
function updateActive(items){ items.forEach((li,idx)=>li.classList.toggle("active",idx===activeIndex)); if(activeIndex>=0 && items[activeIndex]) items[activeIndex].scrollIntoView({block:"nearest"});}
searchInput.addEventListener("input",updateSuggestions);
addSelectedBtn.addEventListener("click",()=>{ if(!searchInput.value.trim()) return; addToShopping(searchInput.value.trim(),parseInt(qtyInput.value||1)); searchInput.value=""; suggestionsEl.style.display="none"; searchInput.focus(); });
printBtn.addEventListener("click",()=>window.print());
clearListBtn.addEventListener("click",()=>{ if(!confirm("Clear shopping list?")) return; shoppingItems=[]; saveShopping(); });

// Admin
addMasterBtn.addEventListener("click",()=>{
  const v=(newMasterItemInput.value||"").trim();
  if(!v) return;
  if(masterItems.includes(v)){ alert("Already in master list"); return; }
  masterItems.push(v); masterItems.sort(); newMasterItemInput.value=""; saveMaster();
});

// Bulk import
bulkImportBtn.addEventListener("click",()=>{
  const text=(bulkImportArea.value||"").trim();
  if(!text){ alert("Paste items to import"); return; }
  const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);
  let added=0;
  lines.forEach(line=>{ if(!masterItems.includes(line)){ masterItems.push(line); added++; }});
  if(added>0){ masterItems.sort(); saveMaster(); }
  bulkImportArea.value="";
  alert(`${added} new item(s) added to master list`);
});

// PDF download
downloadPdfBtn.addEventListener("click",()=>{
  if(shoppingItems.length===0){ alert("Shopping list is empty"); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Shopping List", 14, 20);
  let y=30;
  shoppingItems.forEach(item=>{
    doc.text(item.name,14,y);
    doc.text(item.qty.toString(),140,y);
    doc.line(14,y+2,196,y+2);
    y+=10;
    if(y>280){ doc.addPage(); y=20; }
  });
  doc.save("shopping_list.pdf");
});

renderMaster(); renderShopping();
