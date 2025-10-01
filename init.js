function InitEditor()
{
    VisualEditor.treeItemTemplate = document.getElementById("tree_item_tpl");
    VisualEditor.treeViewContainer = document.getElementById("object_tree");
    VisualEditor.itemPropSheetTemplate = document.getElementById("item_propsheet");
    VisualEditor.propSheetContainer = document.getElementById("object_info");
    VisualEditor.mapLayer = document.getElementById("graphdisplay").getContext("2d");
    VisualEditor.highlightLayer = document.getElementById("selection_display").getContext("2d");
    VisualEditor.mouseArea =  document.getElementById('selection_display');
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
            VisualEditor.propSheetContainer.innerText ="";
            VisualEditor.currentSelection.selection.forEach((item)=>{
               VisualEditor.buildPropSheet(item);
            });
        }
    };
    document.getElementById('bbb2').addEventListener("click",(e)=>{
        document.getElementById('aaa').value=VisualEditor.fixedMap.toCode(0);
        document.getElementById('ccc').value=VisualEditor.lineMap.toCode(0);

    });
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
        warns = {...p.warncodes, ...route_warns};
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