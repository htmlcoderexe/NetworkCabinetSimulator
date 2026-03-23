

class ItemRenderer
{
    ctx = null;
    commands = [];
    registers = [];
    offX=0;
    offY=0;
    constructor(ctx, commands)
    {
        this.ctx = ctx;
        this.commands = commands;
        ctx.textAlign ="center";
        //console.log(this.commands);
    }
    render(item)
    {
        this.registers = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        for(let i = 0; i < this.commands.length;i++)
            {
                let clonedCmd = [...this.commands[i]];
                let cmd = clonedCmd.shift();
                this.doOp(item, cmd, clonedCmd);
                //console.log(i);
            }
    }
    getVar(item, id)
    {
        if(id=="SLOT")
        {
            return item.slot;
        }
        if(id=="PORTLABEL")
        {
            return item.slotLabel;
        }
        return this.registers[id]? this.registers[id] : 0;
    }
    doOp(item, command, args)
    {
        //console.log(command, args);
        const offset = item.getRect(true);
        const offX=offset.x+this.offX;
        const offY=offset.y+this.offY;
        switch(command)
        {
            // variable ops
            case "LDVAR":
            {
                this.registers[args[0]] = this.getVar(item, args[1]);
                
                //console.log(this.registers);
                break;
            }
            case "LDNUM":
            {
                this.registers[args[0]] = args[1];
                break;
            }
            case "INC":
            {
                this.registers[args[0]] = (this.registers[args[0]]-1)+2;
                break;
            }
                
            case "DEC":
            {
                this.registers[args[0]] = this.registers[args[0]]-1;
                break;
            }
                
            case "MUL":
            {
                this.registers[args[2]] = this.registers[args[0]] * this.registers[args[1]];
                break;
            }
            // settings
            case "PEN":
            {
                this.ctx.lineWidth = args[0];
                this.ctx.strokeStyle = args[1];
                break;
            }
            case "FILL":
            {
                this.ctx.fillStyle = args[0];
                break;
            }
            case "FONT":
            {
                this.ctx.font = args[0];
                break;
            }
            // drawing
            case "RECT":
            {
                
                this.ctx.fillRect(args[0]+offX, args[1]+offY, args[2], args[3]);
                this.ctx.strokeRect(args[0]+offX, args[1]+offY, args[2], args[3]);
                break;
            }
            case "PATH":
            {
                this.ctx.translate(offX,offY);
                try{
                    const path = new Path2D(args[0]);
                    this.ctx.fill(path);
                    this.ctx.stroke(path);
                }
                catch(e)
                {
                    console.error("Bad path: <"+args[0]+">");
                }
                this.ctx.translate(-offX,-offY);
                break;
            }
            case "DVAR":
            {
                const txt = this.getVar(item, args[0]) + " ";
                this.ctx.textAlign ="center";
                this.ctx.fillText(txt, args[1]+offX, args[2]+offY);
                //console.log(this.registers);
                break;
            }
            case "TEXT":
            {
                const txt =args[2];
                this.ctx.textAlign ="left";
                this.ctx.fillText(txt, args[0]+offX, args[1]+offY);
                //console.log(this.registers);
                break;
            }

                
        }
    }
}