var game;

function log10(val) {
    return Math.log(val) / Math.LN10;
}

var Fluffy = {
    firstLevel: 1000,
    getFirstLevel: function () {
        var prestigeRequire = Math.pow(this.prestigeExpModifier, game.global.fluffyPrestige);
        return this.firstLevel * prestigeRequire;
    },
    growth: 4,
    specialExpModifier: 1, //For events, test server, etc
    specialModifierReason: "",
    baseExp: 50,
    expGrowth: 1.015,
    currentLevel: 0,
    prestigeDamageModifier: 5,
    prestigeExpModifier: 5,
    currentExp: [],
    damageModifiers: [1, 1.1, 1.3, 1.6, 2, 2.5, 3.1, 3.8, 4.6, 5.5, 6.5],
    rewards: ["stickler", "helium", "liquid", "purifier", "lucky", "void", "helium", "liquid", "eliminator", "overkiller"],
    prestigeRewards: ["dailies", "voidance", "overkiller", "critChance", "megaCrit", "superVoid", "voidelicious", "naturesWrath", "voidSiphon", "plaguebrought"],
    prestige: function () {
        this.calculateLevel();
        if (this.currentLevel < 10) return;
        game.global.fluffyExp = 0;
        game.global.fluffyPrestige++;
        // this.handleBox();
    },
    abortPrestige: function () {
        if (game.global.fluffyPrestige < 1) return;
        game.global.fluffyPrestige--;
        game.global.fluffyExp = Math.floor(this.getFirstLevel() * ((Math.pow(this.growth, 10) - 1) / (this.growth - 1)));
        // this.handleBox();
    },
    canGainExp: function () {
        if (this.currentLevel >= game.portal.Capable.level) return false;
        return true;
    },
    isActive: function(){
        return (game.global.spireRows >= 15 || game.portal.Capable.level > 0);
    },
    isMaxLevel: function() {
        return (this.currentLevel == this.rewards.length);
    },
    getFluff: function () {
        var possibilities = [];
        var timeSeed = Math.floor(new Date().getTime() / 1000 / 30);
        if (this.currentLevel == this.rewards.length){
            possibilities = ["Fluffy's just chillin.", "Fluffy can now predict the future, though he won't tell you what's going to happen.", "Fluffy's looking pretty buff.", "FLUFFY SMASH", "Fluffy's smelling great today.", "Fluffy is a model Trimp.", "Fluffy can do anything.", "Fluffy once killed a Snimp with a well-timed insult.", "Fluffy can juggle 3 dozen scientists without breaking a sweat.", "Fluffy does a barrel roll.", "Fluffy's thinking about writing a book."];
        }
        else {
            possibilities = ["He's enjoying the grind.", "He can't wait to get stronger.", "He could probably use a shower.", "He's growing up so fast.", "His fur is looking healthy today.", "He's feeling quite capable.", "He still drools a bit in his sleep.", "He loves a good game of fetch.", "He's been practicing juggling.", "He does a flip.", "He's the only Trimp not scared by your campfire ghost stories."];
        }
        return possibilities[getRandomIntSeeded(timeSeed, 0, possibilities.length)];
    },
    getExp: function(){
        // if (this.currentExp.length != 3) this.handleBox();
        return this.currentExp;
    },
    calculateExp: function(){
        var level = this.currentLevel;
        var experience = game.global.fluffyExp;
        var removeExp = 0;
        if (level > 0){
            removeExp = Math.floor(this.getFirstLevel() * ((Math.pow(this.growth, level) - 1) / (this.growth - 1)));
        }
        var totalNeeded = Math.floor(this.getFirstLevel() * ((Math.pow(this.growth, level + 1) - 1) / (this.growth - 1)));
        experience -= removeExp;
        totalNeeded -= removeExp;
        this.currentExp = [level, experience, totalNeeded];
    },
    calculateLevel: function(){
        var level = Math.floor(log10(((game.global.fluffyExp / this.getFirstLevel()) * (this.growth - 1)) + 1) / log10(this.growth));
        var capableLevels = game.portal.Capable.level;
        if (level > capableLevels) level = capableLevels;
        this.currentLevel = level;
    },
    calculateInfo: function(){
        if (!this.isActive()){
            this.currentLevel = 0;
            this.currentExp = [];
            return;
        }
        this.calculateLevel();
        this.calculateExp();
        this.updateExp();
        if (this.currentLevel >= 1) giveSingleAchieve("Consolation Prize");
    },
    updateExp: function(){
        var expElem = document.getElementById('fluffyExp');
        var lvlElem = document.getElementById('fluffyLevel');
        var fluffyInfo = this.getExp();
        var width = Math.ceil((fluffyInfo[1] / fluffyInfo[2]) * 100);
        if (width > 100) width = 100;
        expElem.style.width = width + "%";
        lvlElem.innerHTML = fluffyInfo[0];
    },
    rewardExp: function(count){
        if (!this.canGainExp()) return;
        if ((game.global.world < (this.getMinZoneForExp() + 1)) && !count) return;
        var reward = this.getExpReward(true, count);
        game.global.fluffyExp += reward;
        // this.handleBox();
        return reward;
    },
    getMinZoneForExp: function(){
        var zone = 300;
        if (game.portal.Classy.level) zone -= (game.portal.Classy.level * game.portal.Classy.modifier);
        return Math.floor(zone);
    },
    getExpReward: function(givingExp, count) {
        var reward = (this.baseExp + (game.portal.Curious.level * game.portal.Curious.modifier)) * Math.pow(this.expGrowth, game.global.world - this.getMinZoneForExp()) * (1 + (game.portal.Cunning.level * game.portal.Cunning.modifier));
        reward *= this.specialExpModifier;
        if (game.talents.fluffyExp.purchased)
            reward *= 1 + (0.25 * game.global.fluffyPrestige);
        if (playerSpireTraps.Knowledge.owned){
            var knowBonus = playerSpireTraps.Knowledge.getWorldBonus();
            reward *= (1 + (knowBonus / 100));
        }
        if (count) reward *= count;
        if (game.heirlooms.Staff.FluffyExp.currentBonus > 0){
            reward *= (1 + (game.heirlooms.Staff.FluffyExp.currentBonus / 100));
        }
        if (givingExp) game.stats.bestFluffyExp.value += reward;
        //----Modifiers below this comment will not apply to best fluffy exp bone portal credit or stats----
        if (game.global.challengeActive == "Daily")
            reward *= (1 + (getDailyHeliumValue(countDailyWeight()) / 100));
        if (getUberEmpowerment() == "Ice") reward *= (1 + (game.empowerments.Ice.getLevel() * 0.0025));
        return reward;
    },
    getLevel: function(ignoreCapable){
        // if (this.currentExp.length != 3) this.handleBox();
        var level = this.currentLevel;
        var capableLevels = game.portal.Capable.level;
        if (ignoreCapable){
            level = Math.floor(log10(((game.global.fluffyExp / this.getFirstLevel()) * (this.growth - 1)) + 1) / log10(this.growth));
            if (level >= this.rewards.length) level = this.rewards.length;
            return level;
        }
        if (level > capableLevels) level = capableLevels;
        return level;
    },
    getDamageModifier: function () {
        var exp = this.getExp();
        var prestigeBonus = Math.pow(this.prestigeDamageModifier, game.global.fluffyPrestige);
        if (exp[0] < 1 || exp.length != 3) return 1;
        var bonus = this.damageModifiers[exp[0]];
        if (exp[0] >= this.damageModifiers.length || exp[0] == game.portal.Capable.level) return 1 + ((bonus - 1) * prestigeBonus);
        var remaining = (this.damageModifiers[exp[0] + 1] - bonus);
        bonus += ((exp[1] / exp[2]) * remaining);
        return 1 + ((bonus - 1) * prestigeBonus);
    },
    getBonusForLevel: function(level) {
        var prestigeBonus = Math.pow(this.prestigeDamageModifier, game.global.fluffyPrestige);
        var possible = (this.damageModifiers[level] - this.damageModifiers[level - 1]) * 100 * prestigeBonus;
        if (this.currentLevel >= level) {
            return prettify(Math.round(possible)) + "%";
        }
        if (level == this.currentLevel + 1 && game.portal.Capable.level >= level) {
            var earned = possible * (this.currentExp[1] / this.currentExp[2]);
            return prettify(earned) + "% / " + prettify(Math.round(possible)) + "%";
        }
        return "0% / " + prettify(Math.round(possible)) + "%";
    },
    isRewardActive: function(reward){
        var calculatedPrestige = game.global.fluffyPrestige;
        if (game.talents.fluffyAbility.purchased) calculatedPrestige++;
        if (this.currentLevel + calculatedPrestige == 0) return 0;
        var indexes = [];
        for(var x = 0; x < this.rewards.length; x++){
            if (this.rewards[x] == reward)
                indexes.push(x);
        }
        for (var z = 0; z < this.prestigeRewards.length; z++){
            if (this.prestigeRewards[z] == reward)
                indexes.push(this.rewards.length + z)
        }
        var count = 0;
        for (var y = 0; y < indexes.length; y++){
            if (this.currentLevel + calculatedPrestige > indexes[y]) count++;
        }
        return count;
    }
};

var shieldBonusNames = {
    playerEfficiency: 'Player Efficiency',
    trainerEfficiency: 'Trainer Efficiency',
    storageSize: 'Storage Size',
    breedSpeed: 'Breed Speed',
    trimpHealth: 'Trimp Health',
    trimpAttack: 'Trimp Attack',
    trimpBlock: 'Trimp Block',
    critDamage: 'Crit Damage, additive',
    critChance: 'Crit Chance, additive',
    voidMaps: 'Void Map Drop Chance',
    plaguebringer: 'Plaguebringer',
    empty: 'Empty',
};

var staffBonusNames = {
    metalDrop: 'Metal Drop Rate',
    foodDrop: 'Food Drop Rate',
    woodDrop: 'Wood Drop Rate',
    gemsDrop: 'Gem Drop Rate',
    fragmentsDrop: 'Fragment Drop Rate',
    FarmerSpeed: 'Farmer Efficiency',
    LumberjackSpeed: 'Lumberjack Efficiency',
    MinerSpeed: 'Miner Efficiency',
    DragimpSpeed: 'Dragimp Efficiency',
    ExplorerSpeed: 'Explorer Efficiency',
    ScientistSpeed: 'Scientist Efficiency',
    FluffyExp: 'Fluffy Exp',
    empty: 'Empty',
};
