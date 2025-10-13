
function beginVResize(e)
{
    e.target.parentElement.addEventListener("pointermove", doVResize);
    e.target.parentElement.addEventListener("pointerup", endVResize);
}
function doVResize(e)
{
    console.log(e.currentTarget);
    let h = e.y ;
    console.log(h);
    let prev = e.currentTarget.firstElementChild;
    let next = e.currentTarget.firstElementChild.nextElementSibling.nextElementSibling;
    let parent_height = e.currentTarget.offsetHeight;
    console.log(parent_height);
    prev.style.height = ((h/ parent_height)*100-1) + "%";
    next.style.height = (99-(h / parent_height)*100) + "%";
}
function endVResize(e)
{
    e.currentTarget.removeEventListener("pointermove", doVResize);
    e.currentTarget.removeEventListener("pointerup", endVResize);
}
function beginHResize(e)
{
    e.target.parentElement.addEventListener("pointermove", doHResize);
    e.target.parentElement.addEventListener("pointerup", endHResize);
}
function doHResize(e)
{
    console.log(e.currentTarget);
    let w = e.x ;
    console.log(w);
    let prev = e.currentTarget.firstElementChild;
    let next = e.currentTarget.firstElementChild.nextElementSibling.nextElementSibling;
    let parent_width = e.currentTarget.offsetWidth;
    console.log(parent_width);
    let p_w_pct =((w/ parent_width)*100);
    let n_w_pct =100-((w / parent_width)*100);
    let p_min = window.getComputedStyle(prev).getPropertyValue("min-width").slice(0,-1);
    let n_min = window.getComputedStyle(next).getPropertyValue("min-width").slice(0,-1);
    console.log(prev.style,next.style);
    console.log(p_w_pct, p_min, n_w_pct, n_min);
    if(p_w_pct<p_min)
    {
        p_w_pct = p_min;
        n_w_pct = 100-p_min;
    }
    if(n_w_pct<n_min)
    {
        n_w_pct = n_min;
        p_w_pct = 100-n_min;
    }
    prev.style.width = "calc("+(p_w_pct) + "% - 7px)";
    next.style.width = "calc("+(n_w_pct) + "% - 7px)";
    // fucking CSS sizing 
}
function endHResize(e)
{
    e.currentTarget.removeEventListener("pointermove", doHResize);
    e.currentTarget.removeEventListener("pointerup", endHResize);
}

function InitEditor()
{

    document.querySelectorAll(".vresize").forEach((e)=>{
        e.addEventListener("pointerdown",beginVResize);
    });
    document.querySelectorAll(".hresize").forEach((e)=>{
        e.addEventListener("pointerdown",beginHResize);
    });

    VisualEditor.treeItemTemplate = document.getElementById("tree_item_tpl");
    VisualEditor.treeViewContainer = document.getElementById("object_tree");
    VisualEditor.itemPropSheetTemplate = document.getElementById("item_propsheet");
    VisualEditor.propSheetContainer = document.getElementById("object_info");
    VisualEditor.mapLayer = document.getElementById("graphdisplay").getContext("2d");
    VisualEditor.highlightLayer = document.getElementById("selection_display").getContext("2d");
    VisualEditor.mouseArea =  document.getElementById('selection_display');
    VisualEditor.newLineDialogue =  document.getElementById('new_line_dialog');
    VisualEditor.toolBar =  document.getElementById('toolbar_tools');
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
    document.getElementById("mode_pointer").click();
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
        VisualEditor.lineMap.commit(p);
        

        console.log(p.terrain);
        console.log(p.rootObject);
        console.log(VisualItem.hitboxMapping);
        
    VisualEditor.buildTree(document.getElementById("object_tree"), VisualEditor.fixedMap);

    VisualEditor.buildTree(document.getElementById("object_tree"), VisualEditor.lineMap);

        
    });

}