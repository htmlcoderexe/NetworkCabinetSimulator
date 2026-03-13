class VisualCable extends VisualItem
{
    from = null;
    to = null;
	fromBld=null;
	toBld=null;
	endPoint={x:0,y:0};
	startPoint={x:0,y:0};
	constructor(map, name)	{
		super("cable", name, map);
		this.selectionOrder = 3;
	}
    addItem(item)
    {
        this.subItems.push(item);
        return true;
    }
	toCode(indent_level)
	{
		let output ="";
		output+=this._f("cable",indent_level,this.name, this.from.parent.parent.name, this.from.parent.name, this.from.name,this.to.parent.parent.name,this.to.parent.name,this.to.name);
		return output;
	}
	commit(parser)
	{
		this.fromBld=this.from.parent.parent;
		this.toBld=this.to.parent.parent;
		return true;
	}
	get cableWidth()
	{
		// 1px edge + 2 px space    1px edge + 2px cable colours + 1px edge + 2px space   
		return 1+2+this.subItems.length * (1+2+2+1+2);
	}
	updatePosition()
	{
		let w = this.cableWidth/2;
		let startX=this.startPoint.x;
		let startY=this.startPoint.y;
		let endX=this.endPoint.x;
		let endY=this.endPoint.y;
		this.cX = startX > endX ? endX : startX;
		this.cY = startY > endY ? endY : startY;
		let angle = Math.atan2(endY-startY, endX-startX);
        let rAX = -1 * (Math.sin(angle));
        let rAY = Math.cos(angle);

        let offset2=-w;

		const x0 = Math.min(startX+offset2*rAX,endX+offset2*rAX,startX+w*rAX,endX+w*rAX);
		const y0 = Math.min(startY+offset2*rAY,endY+offset2*rAY,startY+w*rAY,endY+w*rAY);
		const x1 = Math.max(startX+offset2*rAX,endX+offset2*rAX,startX+w*rAX,endX+w*rAX);
		const y1 = Math.max(startY+offset2*rAY,endY+offset2*rAY,startY+w*rAY,endY+w*rAY);
		this.cX = x0;this.cY=y0;
		this.width=x1-x0;this.height=y1-y0;
		const dX = endX - startX;
		const dY = endY - startY;
		this.flip = (dX*dY) < 0;


		
	}
	testHit(x, y)
	{
		// as a link is a line between two corners of its bounding rectangle,
		// test for the diagonal collision (selecting the "flipped" diagonal 
		// if determined by the code in the updatePosition method)
		
		let w = this.cableWidth/2;
		let startX=this.startPoint.x;
		let startY=this.startPoint.y;
		let endX=this.endPoint.x;
		let endY=this.endPoint.y;
		let rX = startX > endX ? endX : startX;
		let rY = startY > endY ? endY : startY;
		const dX = endX - startX;
		const dY = endY - startY;
		this.flip = (dX*dY) < 0;
		const testRekt = new GetRect(rX-w,rY-w,dX+w+w,dY+w+w);
		return testRekt.diagonal(x, y, this.cableWidth, this.flip);
	}
	getDrawingGroup()
	{
		return [this.from, this.fromBld,this.to,this.toBld,this];
	}
	drawOutlineFunc(ctx)
	{
		// save the drawing settings to restore later
		ctx.save();

		let offset = this.cableWidth/2;
		let startX=this.startPoint.x;
		let startY=this.startPoint.y;
		let endX=this.endPoint.x;
		let endY=this.endPoint.y;
		let angle = Math.atan2(endY-startY, endX-startX);
        let rAX = -1 * (Math.sin(angle));
        let rAY = Math.cos(angle);

        let offset2=-offset;

		ctx.beginPath();
        ctx.moveTo(startX+offset2*rAX, startY+offset2*rAY);
        ctx.lineTo(endX+offset2*rAX, endY+offset2*rAY);
        ctx.moveTo(startX+offset*rAX, startY+offset*rAY);
        ctx.lineTo(endX+offset*rAX, endY+offset*rAY);
		ctx.stroke();
		
	}
	draw(ctx)
	{
		VisualEditor.drawCallCount++;
		// save the drawing settings to restore later
		ctx.save();

		ctx.lineWidth = 1;
		let offset = this.cableWidth/2;
		let startX=this.startPoint.x;
		let startY=this.startPoint.y;
		let endX=this.endPoint.x;
		let endY=this.endPoint.y;
		let angle = Math.atan2(endY-startY, endX-startX);
		// technically we are rotating the vector [0, offset] by the rotation matrix from the angle
		//
		//     [cos(θ) -sin(θ)]  [x]  =>    [x * cos(θ) - y * sin(θ)]
		//     [sin(θ)  cos(θ)]  [y]  =>    [x * sin(θ) + y * cos(θ)]
		//
		//
		// we get away with only doing half of the rotation matrix, as the X value is 0
		// 
		//   [x] => [-y * sin(θ)]
		//   [y] => [ y * cos(θ)]
        
        let rAX = -1 * (Math.sin(angle));
        let rAY = Math.cos(angle);

        let offset2=-offset;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle ="#000000";
        ctx.moveTo(startX+offset2*rAX, startY+offset2*rAY);
        ctx.lineTo(endX+offset2*rAX, endY+offset2*rAY);
		ctx.stroke();
            offset2+=1;
        this.subItems.forEach((l)=>{
		    ctx.lineWidth = 1;
            offset2+=2;
            ctx.beginPath();
            ctx.strokeStyle ="#000000";
            ctx.moveTo(startX+offset2*rAX, startY+offset2*rAY);
            ctx.lineTo(endX+offset2*rAX, endY+offset2*rAY);
		ctx.stroke();
            offset2+=1.5;
		    ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = l.parent?.colour1;
            ctx.moveTo(startX+offset2*rAX, startY+offset2*rAY);
            ctx.lineTo(endX+offset2*rAX, endY+offset2*rAY);
		ctx.stroke();
            offset2+=2;
		    ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = l.parent?.colour2;
            ctx.moveTo(startX+offset2*rAX, startY+offset2*rAY);
            ctx.lineTo(endX+offset2*rAX, endY+offset2*rAY);
		ctx.stroke();
		    ctx.beginPath();
            ctx.strokeStyle ="#000000";
		    ctx.lineWidth = 1;
            offset2+=1.5;
            ctx.moveTo(startX+offset2*rAX, startY+offset2*rAY);
            ctx.lineTo(endX+offset2*rAX, endY+offset2*rAY);
		ctx.stroke();
            offset2+=1;
            
        });
        ctx.strokeStyle ="#000000";
        ctx.lineWidth = 1;
        offset2+=2;
        ctx.moveTo(startX+offset2*rAX, startY+offset2*rAY);
        ctx.lineTo(endX+offset2*rAX, endY+offset2*rAY);
		ctx.stroke();
        offset2+=1;
/*
        let sX1=startX+rotX;
        let sY1=startY+rotY;
        let eX1=endX+rotX;
        let eY1=endY+rotY;

		// draw the first line
		ctx.moveTo(startX + rotX, startY+rotY);
		ctx.lineTo(endX + rotX,endY+rotY);
		ctx.beginPath();
		// flipping both coordinates of the offset is the same as rotating it by 180 degrees
		// which is conveniently the same as reflecting it 
		// which results in the second line being nicely positioned at the other side 
		ctx.moveTo(startX - rotX, startY-rotY);
		ctx.lineTo(endX - rotX,endY-rotY);
		//ctx.strokeStyle =this.parent.colour2;
		ctx.stroke();
		//*/
        // restore settings
		ctx.restore();
	}
}