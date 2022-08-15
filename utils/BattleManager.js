const getChipData = require('./AttackInfo.js')

module.exports = class BattleManager {

	TypeWeaknessJson = {
		'FIRE': ['WATER', 'WIND'],
		'WOOD': ['FIRE', 'SWORD'],
		'ELEC': ['WOOD', 'BREAK'],
		'AQUA': ['ELEC', 'TARGET'],
		'SWORD': ['BREAK', 'ELEC'],
		'WIND': ['SWORD', 'WOOD'],
		'TARGET': ['WIND', 'FIRE'],
		'BREAK': ['TARGET', 'WATER']
	}

	constructor(navi, enemyList, canEscape) {
		this.navi = navi
		this.enemyList = enemyList

		// Setting up for being able to escape
		this.isPossibleToEscape = canEscape
		this.isEscaped = false

		this.actionQueue = []
	}

	//Get the especified enemy
	getEspecifiedEnemy(name) {
		return this.enemyList.find( o => {
			return o.name === name
		} )
	}

	isBattleOver() {
		if ( this.isEscaped ) // Player escaped
			return true
		else if ( this.navi.HP <= 0 ) // Player lost
			return true
		else if ( this.enemyList.length <= 0 ) // Player won
			return true
		else return false
	}

	isItWeakTo( victimCore, weakCore ) {
		let flag = false
		
		if (weakCore !== 'NEUTRAL' && victimCore !== 'NEUTRAL')
			flag = TypeWeaknessJson[victimCore].includes(weakCore)
		
		return flag
	}

	// "Attack" action
	naviAttacks(target) {
		const enemy = this.getEspecifiedEnemy(target)
		enemy.HP -= 10
		this.enemyLifeCheck()
	}

	// "Cyber Actions" attack
	naviCyberAttacks(target, cpAttack) {
		const chip = getChipData(cpAttack)

		// check if chip is usable
		const tmpCPafterUse = this.navi.CP - chip.cpCost
		if ( tmpCPafterUse < 0) {
			this.addToActionQueue("But there's not enough Cyber Points to do that!")
			return
		}

		// check chip's target type
		// do damage to corresponding targets
		switch (chip.target) {
			case 'Single':
				this.doSingleCP(chip, target)
				break
			case 'Triple':
				this.doTripleCP(chip, target)
				break
			case 'Heal':
				this.doUseHealChip(chip)
				break
		}

		// update stuff
		this.navi.CP = tmpCPafterUse
		this.enemyLifeCheck()
	}

	doSingleCP(chip, target) {
		const enemy = this.getEspecifiedEnemy(target)

		// Deal an array of damage to the enemy
		for (let dmg of chip.attackValue) {
			dmg += this.isItWeakTo(enemy.core, chip.core) * dmg
			this.addToActionQueue(
				this.navi.name+' dealt '+dmg+' damage to '
				+target+' using '+chip.name+'!')
			
			enemy.HP -= dmg
		}
	}

	doTripleCP(chip, target) {
		const enemy = this.getEspecifiedEnemy(target)
		const nmeIndex = this.enemyList.indexOf(enemy)

		// Attack left enemy of target
		if (this.enemyList[nmeIndex-1]) {
			let dmg = chip.attackValue[0]
			dmg += this.isItWeakTo(this.enemyList[nmeIndex-1].core, chip.core) * dmg

			this.addToActionQueue(
				this.navi.name+' dealt '+dmg+' damage to '
				+this.enemyList[nmeIndex-1].name+' using '+chip.name+'!')

			this.enemyList[nmeIndex-1].HP -= dmg
		}

		// Attack target itself
		if (this.enemyList[nmeIndex]) {
			let dmg = chip.attackValue[1]
			dmg += this.isItWeakTo(this.enemyList[nmeIndex].core, chip.core) * dmg

			this.addToActionQueue(
				this.navi.name+' dealt '+dmg+' damage to '
				+this.enemyList[nmeIndex].name+' using '+chip.name+'!')

			this.enemyList[nmeIndex].HP -= dmg
		}

		// Attack right enemy of target
		if (this.enemyList[nmeIndex+1]) {
			let dmg = chip.attackValue[2]
			dmg += this.isItWeakTo(this.enemyList[nmeIndex+1].core, chip.core) * dmg

			this.addToActionQueue(
				this.navi.name+' dealt '+dmg+' damage to '
				+this.enemyList[nmeIndex+1].name+' using '+chip.name+'!')

			this.enemyList[nmeIndex+1].HP -= dmg
		}
	}

	doUseHealChip(chip) {
		// Heal the navi
		let newHP = this.navi.HP + chip.attackValue[0]

		if (newHP >= this.navi.maxHP) {
			this.addToActionQueue(
				this.navi.name+' recovered all their health')
			newHP = this.navi.maxHP
		}
		else {
			this.addToActionQueue(
				this.navi.name+' recovered '+chip.attackValue[0]+ 'HP')
		}

		this.navi.HP = newHP
	}

	// "Escape" action
	naviEscapes() {
		if (!this.isPossibleToEscape) {
			this.addToActionQueue("It's not possible to escape!")
			return
		}

		// Randomly assign if navi was able to escape
		const EscapePercent = 1/5
		this.isEscaped =
			Math.round( Math.random() * EscapePercent * 10 )
			>= Math.floor( EscapePercent * 10 )

		if (!this.isEscaped)
			this.addToActionQueue("...But couldn't!")
	}

	// Add a string to the turn's queue
	addToActionQueue(str) {
		this.actionQueue.push(str)
	}

	clearActionQueue() {
		this.actionQueue = []
	}

	// this.enemyList is modified to its normal state
	// minus the enemies which have 0 or less hp
	enemyLifeCheck() {
		this.enemyList = this.enemyList.filter( e => {
			return e.HP > 0
		})
	}

}
