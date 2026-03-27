
/**
 * Top-level item containing the various templates
 */
class VisualInventory extends VisualItem {
	frameUsages = {};
	bankUsages = {};
	bankUsagesInFrames = {};
	bankUsagesInventory = {};
	conUsages = {};
	conUsagesFrameToBank = {};
	conUsagesInventory = {};
	conUsagesIndirect = {};
	conUsagesInFrames = {};
	conUsagesInBanks = {};
	constructor(name)
	{
		super("inventory",name, null);
	}
	calculateUsages(map)
	{
		let cons = this.allOfType("socket_tpl");
		let banks = this.allOfType("socket_bank");
		let frames = this.allOfType("frame_tpl");
		cons.forEach((con)=>{
			this.conUsages[con.name]=0;
		});
		banks.forEach((bank)=>{
			this.bankUsages[bank.name]=0;
			bank.subItems.forEach((element)=>
			{
				this.conUsages[element.ref]++;
				if(this.conUsagesInBanks[bank.name])
				{
					if(this.conUsagesInBanks[bank.name][element.ref])
					{
						this.conUsagesInBanks[bank.name][element.ref]++;
					}
					else
					{
						this.conUsagesInBanks[bank.name][element.ref]=1;
					}
				}
				else
				{
					this.conUsagesInBanks[bank.name]={[element.ref]:1};
				}
			});
		});
		frames.forEach((frame)=>{
			this.frameUsages[frame.name]=0;
			frame.subItems.forEach((element)=>{
				if(element.type=="connector")
				{
					this.conUsages[element.ref]++;
					if(this.conUsagesInFrames[frame.name])
					{
						if(this.conUsagesInFrames[frame.name][element.ref])
						{
							this.conUsagesInFrames[frame.name][element.ref]++;
						}
						else
						{
							this.conUsagesInFrames[frame.name][element.ref]=1;
						}
					}
					else
					{
						this.conUsagesInFrames[frame.name]={[element.ref]:1};
					}
					
				}
				if(element.type=="bank")
				{
					this.bankUsages[element.ref]++;
					if(this.conUsagesInBanks[element.ref])
					{
						for(let [cref,amount] of Object.entries(this.conUsagesInBanks[element.ref]))
						{
							if(this.conUsagesIndirect[cref])
							{
								this.conUsagesIndirect[cref]+=amount;
							}
							else
							{
								this.conUsagesIndirect[cref]=amount;
							}
							if(!this.conUsagesFrameToBank[frame.name])
							{
								this.conUsagesFrameToBank[frame.name]={};
							}
							if(!this.conUsagesFrameToBank[frame.name][element.ref])
							{
								this.conUsagesFrameToBank[frame.name][element.ref]={};
							}
							if(!this.conUsagesFrameToBank[frame.name][element.ref][cref])
							{
								this.conUsagesFrameToBank[frame.name][element.ref][cref]=0;
							}
							this.conUsagesFrameToBank[frame.name][element.ref][cref]+=amount;

						}
					}
					if(this.bankUsagesInFrames[frame.name])
					{
						if(this.bankUsagesInFrames[frame.name][element.ref])
						{
							this.bankUsagesInFrames[frame.name][element.ref]++;
						}
						else
						{
							this.bankUsagesInFrames[frame.name][element.ref]=1;
						}
					}
					else
					{
						this.bankUsagesInFrames[frame.name]={[element.ref]:1};
					}
				}
			});
		});

		// tally up all frames
		map.subItems.forEach((loc)=>{
			if(loc.type!="location")
				return;
				loc.subItems.forEach((rack)=>{
					rack.subItems.forEach((frame)=>{
						this.frameUsages[frame.frametype]++;
						if(this.bankUsagesInFrames[frame.frametype])
						{
							for(let [bref,amount] of Object.entries(this.bankUsagesInFrames[frame.frametype]))
							{
								if(!this.bankUsagesInventory[bref])
								{
									this.bankUsagesInventory[bref]=0;
								}
								this.bankUsagesInventory[bref]+=amount;
								if(this.conUsagesInBanks[bref])
								{
									for(let [cref,amount2] of Object.entries(this.conUsagesInBanks[bref]))
									{
										if(this.conUsagesInventory[cref])
										{
											this.conUsagesInventory[cref]+=amount2*amount;
										}
										else
										{
											this.conUsagesInventory[cref]=amount2*amount;
										}
									}
								}
							}
						}
						if(this.conUsagesInFrames[frame.frametype])
						{
							for(let [cref,amount3] of Object.entries(this.conUsagesInFrames[frame.frametype]))
							{
								if(this.conUsagesInventory[cref])
								{
									this.conUsagesInventory[cref]+=amount3;
								}
								else
								{
									this.conUsagesInventory[cref]=amount3;
								}
							}
						}
					});
				})
		});
		/*
		console.log(this.frameUsages);
		console.log(this.bankUsagesInventory);
		console.log(this.conUsagesInventory);
		console.warn(this);
		//*/
	}

}