
function beginVResize(e)
{
    e.target.parentElement.addEventListener("pointermove", doVResize);
    e.target.parentElement.addEventListener("pointerup", endVResize);
}
function doVResize(e)
{
    //console.log(e.currentTarget);
    let h = e.y ;
    //console.log(h);
    let prev = e.currentTarget.firstElementChild;
    let next = e.currentTarget.firstElementChild.nextElementSibling.nextElementSibling;
    let parent_height = e.currentTarget.offsetHeight;
    //console.log(parent_height);
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
    //console.log(e.currentTarget);
    let w = e.x ;
    //console.log(w);
    let prev = e.currentTarget.firstElementChild;
    let next = e.currentTarget.firstElementChild.nextElementSibling.nextElementSibling;
    let parent_width = e.currentTarget.offsetWidth;
    //console.log(parent_width);
    let p_w_pct =((w/ parent_width)*100);
    let n_w_pct =100-((w / parent_width)*100);
    let p_min = window.getComputedStyle(prev).getPropertyValue("min-width").slice(0,-1);
    let n_min = window.getComputedStyle(next).getPropertyValue("min-width").slice(0,-1);
    //console.log(prev.style,next.style);
    //console.log(p_w_pct, p_min, n_w_pct, n_min);
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
        let maptext = window.localStorage.getItem("editor_fixedmap_code");
        if(maptext)
        document.getElementById('aaa').value =maptext;
        let linetext = window.localStorage.getItem("editor_linemap_code");
        if(linetext)
        document.getElementById('ccc').value =linetext;
        let invtext = window.localStorage.getItem("editor_inventory_code");
        if(invtext)
        document.getElementById('ddd').value =invtext;
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
    VisualEditor.newItemDialogue =  document.getElementById('new_item_dialog');
    VisualEditor.toolBar =  document.getElementById('toolbar_tools');
    VisualEditor.addFrameDialogue = document.getElementById("add_frame_dialog");
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
    let zs=document.getElementById('zoom_slider');
    document.getElementById('selection_display').addEventListener("wheel", (e)=>{
        // ignore sideways wheel clicks
        if(e.deltaY==0)
            return;
        // check if zooming in or out
        let isup=e.deltaY<1;
        // hardcoded stops like on the slider
        let values = [25,50,75,100,200,300,400,500];
        // signal the zoom function to use mouse position
        window.__scrollZoomX= e.offsetX;
        window.__scrollZoomY=e.offsetY;
        let nextval=50;
        // pick the next higher/lower stop
        if(isup)
        {
            if(VisualEditor.zoom>=5)
                return;
            nextval=Math.min(...values.filter((v)=>v>VisualEditor.zoom*100));
        }
        else
        {
            if(VisualEditor.zoom<=0.25)
                return;
            nextval=Math.max(...values.filter((v)=>v<VisualEditor.zoom*100));
            
        }
        //console.warn(nextval);
        // set slider value and trigger
        zs.value=nextval;
        zs.dispatchEvent(new Event("input"));
    });

    let zl=document.getElementById("zoom_lvl");
    zs.value=100;
    zs.addEventListener("input",(e)=>{
        // by default zoom relative to middle of screen
        let w= document.getElementById("graphdisplay").width/2;
        let h= document.getElementById("graphdisplay").height/2;
        // if this came from the wheel event, the mouse position
        // has been set
        if(window.__scrollZoomX!=undefined)
        {
            w=window.__scrollZoomX;
            h=window.__scrollZoomY;
            // clear after use
            window.__scrollZoomX=undefined;
            window.__scrollZoomY=undefined;
        }
        // the next few lines effectively get the almost right
        // value and then correct it
        // probably should do this more straightforward
        // but I got tired debugging the subtle issues
        // given the various translations between the virtual canvas
        // and the viewport
        let [zoomX,zoomY]=VisualEditor.screenToCanvas(w,h);
        //console.warn(zoomX,zoomY);
        let offsetX = VisualEditor.offsetX-(w/VisualEditor.zoom);
        let offsetY = VisualEditor.offsetY-(h/VisualEditor.zoom);
        //console.log("W+H",w,h,"realOffset",offsetX,offsetY,"currentOffset",VisualEditor.offsetX,VisualEditor.offsetY,"zoom",VisualEditor.zoom);
        VisualEditor.zoom=zs.value/100;
        let newX=offsetX+(w/VisualEditor.zoom);
        let newY=offsetY+(h/VisualEditor.zoom);
        VisualEditor.offsetX=newX;
        VisualEditor.offsetY=newY;
        // no fucking clue. we literally check the difference where the new "screen centre" is projected and then shift by that amount
        // it works. whatever...
        let [zoomX2,zoomY2]=VisualEditor.screenToCanvas(w,h);
        VisualEditor.offsetX-=(zoomX-zoomX2)*VisualEditor.zoom;
        VisualEditor.offsetY-=(zoomY-zoomY2)*VisualEditor.zoom;

        
        //console.warn(zoomX2,zoomY2);



        //console.log("newOffset",newX,newY);
        VisualEditor.refreshView();
        zl.innerHTML=zs.value+"%";
        //console.log("W+H",w,h,"realOffset",offsetX,offsetY,"currentOffset",VisualEditor.offsetX,VisualEditor.offsetY,"zoom",VisualEditor.zoom);
    });
    let rs = new ResizeObserver((entries)=>{
        if(entries[0])
        {
            document.getElementById("graphdisplay").width=document.getElementById("graphdisplay").clientWidth;
            document.getElementById("graphdisplay").height=document.getElementById("graphdisplay").clientHeight;
            document.getElementById("selection_display").width=document.getElementById("graphdisplay").clientWidth;
            document.getElementById("selection_display").height=document.getElementById("graphdisplay").clientHeight;
            VisualEditor.refreshView();
        }
    });
    VisualEditor.selectionChange = ()=>{
        console.log(VisualEditor.currentSelection);
        VisualEditor.propSheetContainer.innerText ="";
        if(VisualEditor.currentSelection.selection.length > 0)
        {
            VisualEditor.currentSelection.selection.forEach((item)=>{
               VisualEditor.buildPropSheet(item);
            });
        }
        VisualEditor.addContextButtons();
    };
    document.getElementById("add_location").addEventListener("click",(e)=>{
        VisualEditor.promptName((e)=>{
				let cname = VisualEditor.newItemDialogue.returnValue;
				if(!cname)
					return;
				let c = new VisualLocation(VisualEditor.fixedMap,cname);
                c.label=cname;
                VisualEditor.currentSelection.set([c]);
                VisualEditor.currentMoving=c;
				VisualEditor.fixedMap.addItem(c);
				VisualEditor.fixedMap.updatePosition();
                VisualEditor.reportUpdate(c.root);
				VisualEditor.refreshView();
			},"Location name","OK");
    });
    document.getElementById("mode_pointer").click();
    document.getElementById('bbb2').addEventListener("click",(e)=>{
        let maptext =VisualEditor.fixedMap.toCode(0);
        document.getElementById('aaa').value=maptext;
        let linetext=VisualEditor.lineMap.toCode(0);
        document.getElementById('ccc').value=linetext;
        // #TODO: saving inventory
        let invtext = document.getElementById('ddd').value;

        window.localStorage.setItem("editor_fixedmap_code", maptext);
        window.localStorage.setItem("editor_linemap_code", linetext);
        window.localStorage.setItem("editor_inventory_code", invtext);

    });
    document.getElementById('bbb').addEventListener("click",(e)=>{

        let p = null;
        

        let txt3 = document.getElementById('ddd').value;
        p = new VisualParser(txt3, invparser, new VisualInventory("Inventory"));
        let warns = {...p.warncodes, ...inv_warns};
        p.warncodes = warns;
        p.init();
        p.go();
        console.log(p.rootObject);
        VisualEditor.loadInventory(p.rootObject);

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
        

        //console.log(p.terrain);
        //console.log(p.rootObject);
        //console.log(VisualItem.hitboxMapping);
        
    VisualEditor.buildTree(document.getElementById("object_tree"), VisualEditor.fixedMap);

    VisualEditor.buildTree(document.getElementById("object_tree"), VisualEditor.lineMap);

    VisualEditor.buildTree(document.getElementById("object_tree"), VisualEditor.inventory);
    VisualEditor.fixedMap.updatePosition();
    VisualEditor.refreshView();
    rs.observe(document.getElementById("graphdisplay"));
        
    });

}