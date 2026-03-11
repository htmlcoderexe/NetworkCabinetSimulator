class VisualCable extends VisualItem
{
    from = null;
    to = null;
	constructor(map, name)	{
		super("cable", name, map);
		this.selectionOrder = 3;
	}
    addItem(item)
    {
        this.subItems.push(item);
        return true;
    }
	draw(ctx)
	{
		VisualEditor.drawCallCount++;
		// save the drawing settings to restore later
		ctx.save();

		ctx.lineWidth = 1;
		// this controls how far the 2 lines will "spread" from the centreline
		let offset = (this.subItems.length * (1+2+2+1+2) +2+1)/2;
		let vertical_margin = 3
		// determine the starting and ending points for the centreline
		// aim for the centreline of the sockets
        let frombldg=this.from.parent.parent;
        let tobldg=this.to.parent.parent;
		let startX = frombldg.cX + (frombldg.width/2);
		let endX = tobldg.cX + (tobldg.width/2);
		// starts at the top of the sockets, with a small hardcoded margin
		let startY = frombldg.cY + (frombldg.height/2);
		// ends at the bottom with the same margin
		let endY = tobldg.cY + (tobldg.height/2);
		// determine the angle (respective to the X axis)
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
		let rotX = -1 * (Math.sin(angle)) * offset;
		let rotY = Math.cos(angle) * offset;
        
        let rAX = rotX = -1 * (Math.sin(angle));
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