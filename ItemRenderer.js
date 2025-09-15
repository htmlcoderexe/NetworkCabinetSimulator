

class ItemRenderer
{
    ctx = null;
    commands = [];
    registers = [];

    construct(ctx, commands)
    {
        this.ctx = ctx;
        this.commands = commands;
    }
    render(item)
    {
        this.registers = [];
        for(let i = 0; i < this.commands.length;i++)
            {
                let clonedCmd = [...this.commands[i]];
                let cmd = clonedCmd.shift();
                this.doOp(item, cmd, clonedCmd);
            }
    }
    getVar(item, id)
    {
        if(id=="SLOT")
        {
            return item.slot;
        }
        return this.registers[id]? this.registers[id] : 0;
    }
    doOp(item, command, args)
    {
        switch(command)
        {
            // variable ops
            case "LDVAR":
            {
                this.registers[args[0] = this.getVar(item, args[1])];
                break;
            }
            case "LDNUM":
            {
                this.registers[args[0] = item, args[1]];
                break;
            }
            case "INC":
            {
                this.registers[args[0]] = this.getVar(item, args[1]);
                break;
            }
                
            case "DEC":
            {
                this.registers[args[0]] = this.getVar(item, args[1]);
                break;
            }
                
            case "MUL":
            {
                this.registers[args[2]] = this.getVar(item, args[0]) * this.getVar(item, args[1]);
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
                const offset = item.getRect(true);
                this.ctx.strokeRect(args[0]+offset.x, args[1]+offset.y, args[2], args[3]);
                break;
            }
            case "DVAR":
            {
                const offset = item.getRect(true);
                const txt = this.getVar(item, args[0]) + " ";
                this.ctx.fillText(txt, args[1]+offset.x, args[2]+offset.y);
                break;
            }

                
        }
    }
}