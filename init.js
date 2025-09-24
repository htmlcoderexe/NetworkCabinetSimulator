function InitEditor()
{
    VisualEditor.treeItemTemplate = document.getElementById("tree_item_tpl");
    VisualEditor.treeViewContainer = document.getElementById("object_tree");
    VisualEditor.itemPropSheetTemplate = document.getElementById("item_propsheet");
    VisualEditor.propSheetContainer = document.getElementById("object_info");
    VisualEditor.mapLayer = document.getElementById("graphdisplay").getContext("2d");
    VisualEditor.highlightLayer = document.getElementById("selection_display").getContext("2d");
   
    //drawMap(document.getElementById('graphdisplay'));
    document.getElementById('selection_display').addEventListener("mousemove", (e)=>{
        canvasHover(e);
        document.getElementById("current_obj").innerText = window.fiber.current;
    });
    document.getElementById('selection_display').addEventListener("click", (e)=>{
        canvasClick(e);
    });
    document.getElementById('selection_display').addEventListener("mousedown", (e)=>{
        canvasMDown(e);
    });
    document.getElementById('selection_display').addEventListener("mouseup", (e)=>{
        canvasMUp(e);
    });

    VisualEditor.selectionChange = ()=>{
        console.log(VisualEditor.currentSelection);
        if(VisualEditor.currentSelection.selection.length > 0)
        {
            console.log(VisualEditor.currentSelection.selection);
            console.log(VisualEditor.currentSelection.selection[0].type);
            
            VisualEditor.propSheetContainer.innerText ="";
            VisualEditor.currentSelection.selection.forEach((item)=>{
               VisualEditor.buildPropSheet(item);
                /*
                let infoblock = document.createElement("div");
                infoblock.classList.add("infoblock");
                let header = document.createElement("h4");
                header.append(item.getFullLabel());
                infoblock.appendChild(header);
                let idata =document.createElement("span"); 
                if(item.type == "patch")
                {
                    let badge = document.createElement("div");
                    badge.classList.add("line_badge");
                    badge.append(" ");
                    badge.style.borderTopColor = item.parent.colour1;
                    badge.style.borderBottomColor = item.parent.colour2;
                    badge.dataset.lineName = item.parent.name;
                    badge.addEventListener("click",(e)=>{
                        VisualEditor.selectLine(e.target.dataset.lineName);
                    });
                    idata.appendChild(badge);
                }
                if(item.type == "location")
                {
                    let toggle = document.createElement("input");
                    toggle.type = "checkbox";
                    toggle.checked = item.collapseState;
                    toggle.addEventListener("change",(e)=>{
                        if(e.target.checked)
                        {
                            item.collapse();
                        }
                        else
                        {
                            item.uncollapse();
                        }
                        VisualEditor.refreshView();
                    });
                    idata.appendChild(toggle);
                }
                idata.append(item.type);
                infoblock.appendChild(idata);
                document.getElementById("object_info").appendChild(infoblock);
                //*/
            });
        }
    };

    document.getElementById('bbb').addEventListener("click",(e)=>{

        let p = null;
        

        let txt3 = document.getElementById('ddd').value;
        p = new VisualParser(txt3, invparser, new VisualInventory("test"));
        let warns = {...p.warncodes, ...inv_warns};
        p.warncodes = warns;
        p.init();
        p.go();
        console.log(p.rootObject);
        VisualEditor.inventory = p.rootObject;

        let txt = document.getElementById('aaa').value;
        
        p = new VisualParser(txt, hwparser, new VisualMap("Equipment"));
        p.inventory = VisualEditor.inventory;
        warns = {...p.warncodes, ...hw_warns};
        p.warncodes = warns;
        //console.log(p.warncodes);
        p.init();
        p.go();
        //console.log(p);
        p.rootObject.updateSize();
        p.rootObject.updatePosition();
        p.rootObject.updateHitboxMapping();
        p.rootObject.draw(VisualEditor.mapLayer);
        window.patchmap.terrain = p.rootObject;
        VisualEditor.fixedMap = p.rootObject;


        let txt2 = document.getElementById('ccc').value;
        p = new VisualParser(txt2, routeparser, new VisualLineMap("Lines"));
        warns = {...p.warncodes, ...hw_warns};
        p.warncodes = warns;
        p.terrain = window.patchmap.terrain;
        //console.log(p.warncodes);
        p.init();
        p.go();
        p.rootObject.updateSize();
        p.rootObject.updatePosition();
        p.rootObject.updateHitboxMapping();
        p.rootObject.draw(VisualEditor.mapLayer);
        window.patchmap.routes = p.rootObject;
        VisualEditor.lineMap = p.rootObject;
        

        console.log(p.terrain);
        console.log(p.rootObject);
        console.log(VisualItem.hitboxMapping);
        
    VisualEditor.buildTree(document.getElementById("object_tree"), VisualEditor.fixedMap);

    VisualEditor.buildTree(document.getElementById("object_tree"), VisualEditor.lineMap);

        
    });

}