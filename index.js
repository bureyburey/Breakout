var introMesg = "Breakout (also known as DX Ball) game rules: the player moves a paddle across the horizontal bottom screen and attempts to keep at least one ball over the bottom border.\n\nthe goal in each level is to clear the screen from all the floating bricks by hitting them with a ball.\n\nthe game offers different bonus drops when hitting a brick, those are marked with a '?' inside them. pick them up for various prizes which will help you to get a high score.\n\nUse the slider to the right to change tilting sensitivity."

function init() {
    var debugMenuEnabled = false;
    var debugMenuCheat=[false,false,false];
    function showDebugMenu(){
        document.getElementById("debugMenu").style.display = "block";
    }
    if (debugMenuEnabled) {
        showDebugMenu();
    }
    function checkDebugMenuCheat(){
        if(!debugMenuCheat[0] || !debugMenuCheat[1] || !debugMenuCheat[2])
            return;
        showDebugMenu();
    }
    document.getElementById("levelValue").onclick=function(){
        debugMenuCheat[0]=true;
        document.getElementById("levelValue").style.color="red";
        checkDebugMenuCheat();
    }
    document.getElementById("scoreValue").onclick=function(){
        debugMenuCheat[1]=true;
        document.getElementById("scoreValue").style.color="yellow";
        checkDebugMenuCheat();
    }
    document.getElementById("livesValue").onclick=function(){
       debugMenuCheat[2]=true; 
       document.getElementById("livesValue").style.color="green";
       checkDebugMenuCheat();
    }
    
    
    var scoreboard = new Scoreboard();
    //// device movement capture functions start
    if (window.DeviceMotionEvent) {
        // add mobile movemnt support (why not?)
        window.addEventListener("devicemotion", motion, false);
    }
    else {
        console.log("DeviceMotionEvent is not supported");
    }
    function motion(event) {
        // multiply to increase sensitivity to tilting
        if ((gameInterval && !tester) || introInterval) {
            xPaddle -= (event.accelerationIncludingGravity.x)*(xOffset / 2);
            // prevent going over the left side of the canvas
            if (xPaddle <= 0)
                xPaddle = 0;
            // prevent going over the right side of the canvas
            if (xPaddle + paddleWidth >= canvas.width)
                xPaddle = canvas.width - paddleWidth;
        }
        // use the console log below for debugging purposes
        /*console.log("Accelerometer: "
        + event.accelerationIncludingGravity.x + ", "
        + event.accelerationIncludingGravity.y + ", "
        + event.accelerationIncludingGravity.z
        );*/
    }
    //// device movement capture functions end


    function randVal(min, max) {
        return Math.floor(Math.random()*(max - min + 1) + min);
    }

    function randFloat(min, max) {
        return (Math.random()*(max - min + 1) + min);
    }

    ////// EXPLOSION METHODS START
    var particles = [];
    function Particle() {
        /*
        * A single explosion particle
        */
        this.scale = 1.0;
        this.x = 0;
        this.y = 0;
        this.radius = 20;
        this.color = "#000";
        this.velocityX = 0;
        this.velocityY = 0;
        this.scaleSpeed = 0.5;

        this.update = function(ms)
        {
            // shrinking
            this.scale -= this.scaleSpeed * ms / 1000.0;

            if (this.scale <= 0)
            {
                this.scale = 0;
            }
            // moving away from explosion center
            this.x += this.velocityX * ms / 1000.0;
            this.y += this.velocityY * ms / 1000.0;
        };

        this.draw = function(context2D)
        {
            // translating the 2D context to the particle coordinates
            context2D.save();
            context2D.translate(this.x, this.y);
            context2D.scale(this.scale, this.scale);

            // drawing a filled circle in the particle's local space
            context2D.beginPath();
            context2D.arc(0, 0, this.radius, 0, Math.PI * 2, true);
            context2D.closePath();

            context2D.fillStyle = this.color;
            context2D.fill();

            context2D.restore();
        };
    }

    function createExplosion(x, y, color) {
        /*
        * Advanced Explosion effect
        * Each particle has a different size, move speed and scale speed.
        *
        * Parameters:
        *     x, y - explosion center
        *     color - particles' color
        */
        var minSize = 10;
        var maxSize = 30;
        var count = 10;
        var minSpeed = 60.0;
        var maxSpeed = 200.0;
        var minScaleSpeed = 1.0;
        var maxScaleSpeed = 4.0;

        for (var angle = 0; angle < 360; angle += Math.round(360 / count))
        {
            var particle = new Particle();
            particle.x = x;
            particle.y = y;
            particle.radius = randVal(minSize, maxSize);
            particle.color = color;
            particle.scaleSpeed = randVal(minScaleSpeed, maxScaleSpeed);
            var speed = randVal(minSpeed, maxSpeed);
            particle.velocityX = speed * Math.cos(angle * Math.PI / 180.0);
            particle.velocityY = speed * Math.sin(angle * Math.PI / 180.0);
            particles.push(particle);
        }
    }

    function update(frameDelay) {
        // update and draw particles
        for (var i = 0; i < particles.length; i++) {
            var particle = particles[i];
            particle.update(frameDelay);
            particle.draw(ctx);
            if (particle.scale === 0) {
                particles.splice(i, 1);
            }
        }
    }

    function drawExplosions() {
        update(30);
    }
    ////// EXPLOSION METHODS END



    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");
    
    // set the canvas size ratio according to the client window size
    // change 0.9 and 0.65 to play with the ratios
    var widthRatio = 0.9;
    var heightRatio = 0.65;

    // re-set the width and height according to user specified ratios
    canvas.width = window.innerWidth*widthRatio;
    canvas.height = window.innerHeight*heightRatio;

    // debugging variables
    var tester = false;
    var predictive = false;

    // offset variable for setting paddle speed
    var xOffset = parseInt(document.getElementById("xOffset").value);
    // get the default value from the HTML page
    document.getElementById("xOffsetValue").innerHTML = xOffset;

    // game stats default settings
    var gameStatsDefault = {
        level:1,
        score : 0,
        lives : 3,
        bonusesSpawned : 0,
        bonusesPicked : 0,
        pointsPerBrick : 1,
        pointsPerBonus : 1,
        pointsPerBall : 5
    }
    // create deep copy of the default game stats
    var gameStats = Object.create(gameStatsDefault);

    var balls = []; // array list for the balls
    // default ball settings
    var ballSettingsDefault = {
        positionPercent:0.5,
        xMinSpeed : 2,
        xMaxSpeed : 7,
        yMinSpeed : 2,
        yMaxSpeed : 5,
        count : 1,
        radius : 8,
        minBallRadius : 3,
        maxBallRadius : 20,
        colors : ['red','yellow','green','blue','purple']
    }
    // deep copy the default ball settings
    var ballSettings = Object.create(ballSettingsDefault);

    var bricks = []; // array list for the bricks
    // default brick settings
    var brickSettingsDefault = {
        xStart:canvas.width*(0.1),
        yStart : canvas.height*(0.1),
        xCurrent : canvas.width*(0.1),
        yCurrent : canvas.height*(0.1),
        xSpeed : 0,
        xMaxSpeed : 3,
        xIncrSpeed : 0.05,
        ySpeed : 0,
        yMaxSpeed : 1,
        yIncrSpeed : 0,
        count : 10,
        cols : 1,
        rows : 1,
        maxRows : 10,
        width : 40,
        minWidth : 15,
        height : 20,
        minHeight : 12,
        colors : ['red','yellow','green','blue','purple'],
        margin : 0
    }
    // deep copy the default brick settings
    var brickSettings = Object.create(brickSettingsDefault);

    var bonuses = []; // array list for the bonuses
    var bonusSettingsDefault = {
        radius:10,
        dropSpeed : 1.5,
        probability : 0.5,
        minProb : 0.08,
        decreaseProb : 0.02,
        powerUps : ['enlargePaddle','shrinkPaddle','enlargeBalls','shrinkBalls','extraBall','multiplyBalls','speedDown','speedUp','extraLife','ghostBall','cannonsOn'],
        colors : ['red','yellow','green','blue','purple'],
    }
    // deep copy the default bonus settings
    var bonusSettings = Object.create(bonusSettingsDefault);

    // paddle settings
    var paddleHeight = 10;
    var paddleWidth = canvas.width / 4;
    var maxPaddleWidth = 120;
    var minPaddleWidth = 50;
    var xPaddle = (canvas.width - paddleWidth) / 2;
    
    // cannon settings
    var cannonsActive = false;
    var cannonShots = [];
    var cannonShotSpeed = 3;
    var cannonMaxShots = 10;
    var shotSide = true;

    // animation handling variables
    var drawDelay = 15;
    var introInterval = null;
    var gameInterval = null;
    var drawBrickGenerationDelay = 50;
    var generateBricksInterval = null;

    // game flags
    var generatingBricks = false;
    var gameOver = false;
    var gamePaused = true;

    // keyboard variables
    var keys = {
        left:false,
        right : false
    }

    function fireCannon() {
        // fire cannons function
        // do not allow to add shots if the cannon is not active or if limit reached (need cooldown)
        if (cannonShots.length >= cannonMaxShots || !cannonsActive)
            return;
        shotSide = !shotSide; // switch shot side after each shot

        // add shot to the shots list
        cannonShots.push({
            x:((shotSide) ? xPaddle : (xPaddle + paddleWidth)),
            y : canvas.height - paddleHeight,
            speed : cannonShotSpeed
        });
    }

    // attach onclick function to FIRE button
    document.getElementById("fireCannon").onclick = fireCannon;
    
    // attach onclick function to Scoreboard button
    document.getElementById("showScoreboard").onclick = function() {
        try {
            scoreboard.showScoreBoard();
            if (!tester)
                pauseGame();
        }
        catch (err) {}
    }

    // attach onclick function to New Game button
    document.getElementById("newGame").onclick = function() {
        canvas.width = window.innerWidth*widthRatio;
        canvas.height = window.innerHeight*heightRatio;

        if (introInterval) {
            // clear the intro minigame if it is running
            clearInterval(introInterval);
            introInterval = null;
        }
        // disable the New Game button
        document.getElementById("newGame").disabled = true;
        // reset the game settings
        resetGame();
    }

    // attach onchange function to the sensitivity of the paddle
    document.getElementById("xOffset").onchange = function() {
        xOffset = parseInt(document.getElementById("xOffset").value);
        document.getElementById("xOffsetValue").innerHTML = xOffset;
    }

    ///// DEBUGGING TOOLS /////
    document.getElementById("autoTest").onclick = function() {
        tester = document.getElementById("autoTest").checked;
    }
    document.getElementById("predictiveLine").onclick = function() {
        predictive = document.getElementById("predictiveLine").checked;
    }
    document.getElementById("increaseLevel").onclick = function() {
        if (!gamePaused)
            increaseLevel();
    }
    ///// DEBUGGING TOOLS /////

    // update a HTML div element which display various game messages
    function updateGameEventMessage(str) {
        document.getElementById("gameEvent").innerHTML = str;
    }

    // update various display values (current level, current score, current lives)
    function updateDisplayValues() {
        document.getElementById("levelValue").innerHTML = gameStats.level;
        document.getElementById("scoreValue").innerHTML = gameStats.score;
        document.getElementById("livesValue").innerHTML = gameStats.lives;
    }

    // attach on canvas click function which pauses/resumes the game
    canvas.onclick = function() {
        if (gameInterval) {
            pauseGame();
        }
        else {
            resumeGame();
        }
    }

    // attach event listeners for keyboard events
    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);
    // holding finger down on arrow key function.
    function keyDownHandler(e) {
        if (e.keyCode === 39) {
            keys.right = true;
        }
        else if (e.keyCode === 37) {
            keys.left = true;
        }
        else if (e.keyCode === 80) {
            if (!gamePaused)
                pauseGame();
            else
                resumeGame();
        }
        else if (e.keyCode === 32) {
            fireCannon();
        }
    }
    //lifting finger off arrow key function
    function keyUpHandler(e) {
        if (e.keyCode === 39) {
            keys.right = false;
        }
        else if (e.keyCode === 37) {
            keys.left = false;
        }
    }

    function keyMovementUpdate() {
        //right arrow key direction
        if (keys.right && xPaddle < canvas.width - paddleWidth) {
            xPaddle += xOffset;
        }
        //left arrow key function
        else if (keys.left && xPaddle > 0) {
            xPaddle -= xOffset;
        }
    }

    // add score function
    function addScore(score) {
        gameStats.score += score*((tester === false) ? 1 : -1);
    }

    function pauseGame() {
        // do not pausing if:
        // game is over
        // during introduction screen
        // in the middle of bricks generation
        // if the game is already paused
        if (gameOver || introInterval || generatingBricks || !gameInterval)
            return;
        // set the gamePaused flag to true
        gamePaused = true;
        // draw on screen a message indicating the game is paused
        ctx.font = "12px 'Press Start 2P', Times New Roman";
        ctx.fillStyle = 'blue';
        ctx.fillText("Game Paused", myCanvas.width*0.05, myCanvas.height*0.5);
        ctx.fillText("Tap Screen To Continue...", myCanvas.width*0.05, myCanvas.height*0.6);
        ctx.fillText("'P' To Continue...", myCanvas.width*0.05, myCanvas.height*0.7);
        // clear the animation interval to stop the game
        clearInterval(gameInterval);
        gameInterval = null;
    }

    function resumeGame() {
        // do not resuming if:
        // game is over
        // during introduction screen
        // in the middle of bricks generation
        // if the game is already in progress
        if (gameOver || introInterval || generatingBricks || gameInterval)
            return;
        // set the gamePaused flag to false
        gamePaused = false;
        // re-start the game animation interval to resume the game
        gameInterval = setInterval(gameLoop, drawDelay);
    }
    
    // update all of the balls positions
    function updateBallPositions() {
        // update ball coordinates
        for (i = 0; i < balls.length; i++) {
            balls[i].x += balls[i].xSpeed;
            balls[i].y += balls[i].ySpeed;
        }
    }

    function calculateBricksCount(settings) {
        // calculate how many bricks can fit into a given area of the canvas
        // total space for one row of bricks (with margins)
        spaceAvailForRow = Math.floor(canvas.width*0.8);
        // space required for each brick (including margin)
        spaceReqForEachBrick = (settings.width + settings.margin);
        // calculate amount of bricks possible in each row
        settings.cols = Math.floor(spaceAvailForRow / spaceReqForEachBrick);
        // calculate amount of rows according to the level
        settings.rows = Math.min(brickSettings.maxRows, gameStats.level);
        // calculate total bricks count
        settings.count = settings.cols*settings.rows;
    }

    //drawing our ball
    function drawBall(ball) {
        if (ball.ghostMode) {
            // if the ghost mode is active on the ball, draw an orange circle around it
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius*1.3, 0, Math.PI * 2);
            ctx.fillStyle = 'orange';
            ctx.fill();
        }
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }

    function drawBalls() {
        // call the drawBall function on each ball
        for (i = 0; i < balls.length; i++) {
            drawBall(balls[i]);
        }
    }

    function drawShots() {
        // draw all cannon shots
        for (i = 0; i < cannonShots.length; i++) {
            ctx.fillStyle = "orange";
            ctx.beginPath();
            ctx.arc(cannonShots[i].x, cannonShots[i].y, 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
            cannonShots[i].y -= cannonShots[i].speed;
            if (cannonShots[i].y < 0)
                cannonShots.splice(i, 1);
        }
    }

    function drawPaddle(color) {
        // draw the paddle with a given color
        ctx.beginPath();
        ctx.rect(xPaddle, canvas.height - paddleHeight, paddleWidth, paddleHeight);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        if (cannonsActive) {
            // draw the cannons of the paddle if active
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'lightgreen';
            ctx.beginPath();
            ctx.moveTo(xPaddle, canvas.height - paddleHeight - 5);
            ctx.lineTo(xPaddle, canvas.height);
            ctx.moveTo(xPaddle + paddleWidth, canvas.height - paddleHeight - 5);
            ctx.lineTo(xPaddle + paddleWidth, canvas.height);
            ctx.closePath();
            ctx.stroke();
        }
    }

    function setBallsSpeed(speed) {
        // sets speed for all the active balls
        // first determine which direction the ball is going on each axis
        // then increase the actual speed with the given value and multiply by the direction value (1 or -1)
        for (i = 0; i < balls.length; i++) {
            xDir = ((balls[i].xSpeed < 0) ? -1 : 1);
            balls[i].xSpeed = (Math.abs(balls[i].xSpeed) + speed)*xDir;
            yDir = ((balls[i].ySpeed < 0) ? -1 : 1);
            balls[i].ySpeed = (Math.abs(balls[i].ySpeed) + speed)*yDir;
            if (balls[i].ySpeed === 0) {
                balls[i].ySpeed = 0.5*yDir;
            }
        }
    }

    function setCannons(active) {
        // sets the cannons on/off by changing the boolean value and displaying/hiding the button
        mode = ((active) ? "block" : "none");
        document.getElementById("fireCannon").style.display = mode;
        cannonsActive = active;
    }

    function claimBonus(bonus) {
        // claim picked bonus
        addScore(gameStats.pointsPerBonus);
        gameStats.bonusesPicked++;
        gameEventString = null;
        // check which bonus is given
        switch (bonus.prize) {
            // switch("cannonsOn"){
        case 'enlargePaddle':
            paddleWidth = Math.min(maxPaddleWidth, paddleWidth + 5);
            gameEventString = "Enlarge Paddle";
            break;
        case 'shrinkPaddle':
            paddleWidth = Math.max(minPaddleWidth, paddleWidth - 5);
            gameEventString = "Shrink Paddle";
            break;
        case 'extraBall':
            generateBall(bonus.x, bonus.y);
            createExplosion(bonus.x, bonus.y, bonus.color);
            gameEventString = "Extra Ball";
            break;
        case 'enlargeBalls':
            resizeBalls(1.5)
                gameEventString = "Enlarge Balls";
            break;
        case 'shrinkBalls':
            resizeBalls(0.5)
                gameEventString = "Shrink Balls";
            break;
        case 'multiplyBalls':
            generateMultiBalls();
            gameEventString = "Multiply Balls";
            break;
        case 'speedDown':
            setBallsSpeed(-0.5);
            gameEventString = "Ball Speed Down";
            break;
        case 'speedUp':
            setBallsSpeed(0.2);
            gameEventString = "Ball Speed Up";
            break;
        case 'extraLife':
            gameStats.lives++;
            gameEventString = "Extra Life";
            break;
        case 'ghostBall':
            setGhostMode();
            gameEventString = "Ghost Ball ON";
            break;
        case 'cannonsOn':
            setCannons(true);
            gameEventString = "Cannons ON<br />Spacebar to fire";
            break;
        default:
            //console.log("error in claimBonus method");
            break;
        }
        updateGameEventMessage("Bonus Picked:<br />" + gameEventString);
    }

    function drawBonus(bonus) {
        // draws a bonus
        ctx.beginPath();
        ctx.arc(bonus.x, bonus.y, bonus.radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = bonus.color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.font = "15px Arial";
        ctx.fillStyle = 'black';
        ctx.fillText("?", bonus.x - (bonus.radius) / 2, bonus.y + (bonus.radius) / 2);
    }

    function drawBonuses() {
        // call the draw bonus function and update the bonus location
        for (i = 0; i < bonuses.length; i++) {
            drawBonus(bonuses[i]);
            bonuses[i].y += bonuses[i].dropSpeed;
        }
    }

    function checkBonuses() {
        // check if a bonus was taken or went out of the bottom screen
        for (i = 0; i<bonuses.length; i++) {
            bonus = bonuses[i];
            if (((bonuses[i].y + bonuses[i].radius>canvas.height - paddleHeight&&bonuses[i].y - bonuses[i].radius < canvas.height) && (bonuses[i].x >= xPaddle&&bonuses[i].x <= xPaddle + paddleWidth))) {
                bonuses.splice(i, 1);
                claimBonus(bonus);
                continue;
            }
            if (bonuses[i].y > canvas.height + bonuses[i].radius) {
                bonuses.splice(i, 1);
            }
        }
    }

    function drawPredictiveLine(ball) {
        // for debugging purposes, calculate the next hitting point placement

        // find distances from the walls
        xNextCollision = ((ball.xSpeed < 0) ? 0 : canvas.width);
        xDistWall = Math.abs(ball.x - xNextCollision);
        yNextCollision = ((ball.ySpeed < 0) ? 0 : canvas.height);
        yDistWall = Math.abs(ball.y - yNextCollision);

        // find which wall gonna hit next 
        timeToX = xDistWall / Math.abs(ball.xSpeed);
        timeToY = yDistWall / Math.abs(ball.ySpeed);

        if (timeToX < timeToY) {
            // x wall gonna be hit next
            xNext = xNextCollision;
            yNext = ball.y + ball.ySpeed*timeToX;
        }
        else {
            // y wall gonna be hit next
            xNext = ball.x + ball.xSpeed*timeToY;
            yNext = yNextCollision;
        }

        // draw the line
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(xNext, yNext);
        ctx.closePath();
        ctx.stroke();
    }

    function drawPredictiveLines() {
        // draw predictive lines for all balls
        for (i = 0; i < balls.length; i++) {
            drawPredictiveLine(balls[i]);
        }
    }

    function calculatePaddleHit(ball) {
        // find x axis speed after the ball hit the paddle
        
        // find collision point from start of paddle (left side)
        xCollision = Math.abs(ball.x - xPaddle);
        // find the distance from middle
        middleDist = (xCollision - paddleWidth / 2);

        // max distance is paddleWidth/2, so let's scale it down
        // divide by a constanct factor will give as a scale down
        // experiment with different values and see how the game react
        ball.xSpeed = middleDist / (paddleWidth/10);
    }

    function checkCollisionWalls(ball) {
        // check collision on walls
        // divided left and right wall to prevent specific cases when ball is enlarged near the wall and get stuck
        if (ball.x + ball.xSpeed >= canvas.width - ball.radius && ball.xSpeed > 0) {
            // right wall collision
            ball.xSpeed = Math.abs(ball.xSpeed)*(-1);
        }
        else if(ball.x + ball.xSpeed <= ball.radius && ball.xSpeed < 0){
            ball.xSpeed = Math.abs(ball.xSpeed);
        }
        // upper wall collision
        if (ball.y <= ball.radius && ball.ySpeed < 0) {
            ball.ySpeed *= (-1);
        }
    }

    function checkCollisionPaddle(ball) {
        // check for collision with paddle
        if (ball.y >= canvas.height - ball.radius - paddleHeight) {
            // we have the right height, let's check if the x is good as well
            if (ball.x >= xPaddle && ball.x <= xPaddle + paddleWidth && ball.ySpeed > 0) {
                drawPaddle('yellow');
                // ball.ySpeed > 0 prevents the ball from changing direction constantly if it came to contact with paddle from the side
                // calculate new speed on x axis
                calculatePaddleHit(ball);
                // change direction of the ball
                ball.ySpeed *= (-1);
            }
        }
    }

    function hitBrick(ball, brick) {
        // check if a ball hit a brick
        if (ball.x >= brick.x&&ball.x <= brick.x + brick.width) {
            // ball is in block.x - block.width
            // check top hit or bottom hit
            if (ball.y + ball.radius >= brick.y
                &&
                ball.y - ball.radius <= brick.y + brick.height) {
                // updateGameEventMessage("Hit TOP/BOTTOM");
                brick.power--;
                if (ball.ghostMode) {
                    return true;
                }
                ball.ySpeed *= (-1);
            }
        }
        if (ball.y >= brick.y&&ball.y <= brick.y + brick.height) {
            // ball is in block.y - block.height
            // check left hit or right hit
            if (ball.x + ball.radius >= brick.x
                &&
                ball.x - ball.radius <= brick.x + brick.width) {
                // updateGameEventMessage("Hit LEFT/RIGHT");
                brick.power--;
                if (ball.ghostMode) {
                    return true;
                }
                ball.xSpeed *= (-1);
            }
        }
        if (brick.power <= 0)
            return true;
        return false;
    }

    function hitShot(shot, brick) {
        // check if a shot hit a brick
        if (shot.x >= brick.x&&shot.x <= (brick.x + brick.width) && shot.y >= brick.y&&shot.y <= (brick.y + brick.height)) {
            brick.power--;
            return true
        }
        return false;
    }

    function checkShotsHits() {
        // check if any of the shots hit a brick
        for (i = 0; i < bricks.length; i++) {
            for (j = 0; j < cannonShots.length; j++) {
                if (hitShot(cannonShots[j], bricks[i])) {
                    if (bricks[i].power <= 0) {
                        addScore(gameStats.pointsPerBrick);
                        if (bricks[i].hasBonus) {
                            createExplosion(bricks[i].x + bricks[i].width / 2, bricks[i].y + bricks[i].height / 2, bricks[i].color);
                            generateBonus(bricks[i].x, bricks[i].y);
                        }
                        bricks.splice(i, 1);
                        cannonShots.splice(j, 1);
                        break;
                    }
                    cannonShots.splice(j, 1);
                }
            }
        }
    }

    function checkCollisionBricks() {
        // check if any of the balls hit a brick
        for (i = 0; i < bricks.length; i++) {
            for (j = 0; j < balls.length; j++) {
                if (hitBrick(balls[j], bricks[i])) {
                    addScore(gameStats.pointsPerBrick);
                    if (bricks[i].hasBonus) {
                        createExplosion(bricks[i].x + bricks[i].width / 2, bricks[i].y + bricks[i].height / 2, bricks[i].color);
                        generateBonus(bricks[i].x, bricks[i].y);

                    }
                    bricks.splice(i, 1);
                    break;
                }
            }
        }
    }

    function checkCollisions() {
        // check all type of collisions (walls, paddle and bricks)
        for (i = 0; i < balls.length; i++) {
            checkCollisionWalls(balls[i]);
            checkCollisionPaddle(balls[i]);
        }
        checkCollisionBricks();
    }

    function showGameOverMessage() {
        // show game over message, DUH
        ctx.font = "20px 'Press Start 2P', Times New Roman";
        ctx.fillStyle = 'red';
        ctx.fillText("Game Over!!!", myCanvas.width*0.2, myCanvas.height*0.5);
    }

    function checkGameOver() {
        // check for game over situation
        for (i = 0; i<balls.length; i++) {
            if (balls[i].y>canvas.height + balls[i].radius) {
                // a ball gone below the paddle
                balls.splice(i, 1); // remove the ball from the balls list
                if (balls.length === 0) {
                    // check if any more balls left on the list
                    // detach the setInterval on gameInterval
                    // meaning, we break the endless cycle that was created by setInterval
                    if (gameStats.lives > 1) {
                        // check if any lives left and resume the level with one less life
                        gameStats.lives--;
                        generateBall(canvas.width*(ballSettings.positionPercent), canvas.height*(ballSettings.positionPercent));
                        bonuses = [];
                        startLevel();
                        return;
                    }
                    showGameOverMessage();
                    scoreboard.submitNewScoreDialog(gameStats.score);
                    document.getElementById("newGame").disabled = false;
                    clearInterval(gameInterval);
                    gameOver = true;
                }
            }
        }

    }

    function reverseBricksDirection() {
        // reverse all of the x speed of the bricks
        for (i = 0; i < bricks.length; i++) {
            bricks[i].xSpeed *= (-1);
        }
    }

    function checkBricksDirection() {
        // check all bricks if any of them reached the wall
        for (i = 0; i < bricks.length; i++) {
            if ((bricks[i].x <= 0) || (bricks[i].x + bricks[i].width >= canvas.width)) {
                reverseBricksDirection();
                break;
            }
        }
    }

    function updateBricksPosition() {
        // update bricks x position
        for (i = 0; i < bricks.length; i++) {
            bricks[i].x -= bricks[i].xSpeed;
        }
    }

    function drawBricks() {
        // draw all bricks
        for (i = 0; i < bricks.length; i++) {
            x = bricks[i].x;
            y = bricks[i].y;
            ctx.beginPath();
            // draw the brick
            ctx.rect(x, y, bricks[i].width, bricks[i].height);
            ctx.fillStyle = bricks[i].color;
            ctx.fill();
            ctx.strokeStyle = "black";
            // draw emphasize the brick frame according to the power of the brick
            ctx.lineWidth = (bricks[i].power*0.5) + (0.5);
            ctx.fill("evenodd");
            ctx.stroke();
            ctx.closePath();

            if (bricks[i].hasBonus) {
                // draw bonus indicator
                ctx.fillStyle = ((Math.random() < 0.5) ? "orange" : "yellow");
                ctx.beginPath();
                ctx.arc(x + bricks[i].width*0.5, y + bricks[i].height*0.5, bricks[i].height*0.3, 0, Math.PI * 2, true);
                ctx.fill();
                ctx.closePath();
            }

        }
    }

    function generateBonus(_x, _y) {
        // generate new bonus on given (_x,_y) coordinates
        gameStats.bonusesSpawned++;
        randColor = bonusSettings.colors[randVal(0, bonusSettings.colors.length - 1)];
        randPrize = bonusSettings.powerUps[randVal(0, bonusSettings.powerUps.length - 1)];
        bonuses.push({
            x:_x,
            y : _y,
            radius : bonusSettings.radius,
            prize : randPrize,
            dropSpeed : bonusSettings.dropSpeed,
            color : randColor,
        });
    }

    function generateBall(_x, _y) {
        // generate new ball on (_x,_y) coordinates
        randColor = ballSettings.colors[randVal(0, ballSettings.colors.length - 1)];
        balls.push({
            x:_x,
            y : _y,
            xSpeed : randFloat(-ballSettings.xMinSpeed,ballSettings.xMinSpeed),
            ySpeed : -ballSettings.yMinSpeed,
            radius : ballSettings.radius,
            color : randColor,
            ghostMode : false
        });
    }

    function generateBalls() {
        // generate ballSettings.count amount of balls on a starting position
        xBallFirst = canvas.width*(ballSettings.positionPercent);
        xBall = xBallFirst;
        yBall = canvas.height*(ballSettings.positionPercent);
        for (i = 0; i < ballSettings.count; i++) {
            generateBall(xBall, yBall);
        }
    }

    function generateMultiBalls() {
        // multiply number of ball of the game
        count = balls.length; // IMPORTANT! must iterate count times AND NOT balls.length directly, otherwise each push increases the balls amount which causes an infinite loops!!!!
        for (i = 0; i < count; i++) {
            generateBall(balls[i].x, balls[i].y);
            balls[balls.length - 1].radius = balls[i].radius;
            balls[balls.length - 1].ghostMode = balls[i].ghostMode;
            balls[balls.length - 1].color = balls[i].color;
            createExplosion(balls[i].x, balls[i].y, balls[i].color);
        }
    }

    function resizeBalls(factor) {
        // resize the balls by a certain factor
        count = balls.length;
        for (i = 0; i < count; i++) {
            balls[i].radius *= factor;
            if (factor > 1) {
                // enlarge to maximal size if size too big after resizing
            }
            if (factor < 1) {
                // reduce to minimal size of current size is too small after resizing
                balls[i].radius = Math.max(ballSettings.minBallRadius, balls[i].radius);
            }
        }
    }

    function setGhostMode() {
        // activate ghost mode on all active balls
        count = balls.length;
        for (i = 0; i < count; i++) {
            balls[i].ghostMode = true;
        }
    }

    function generateBrick(_x, _y) {
        // generate brick on (_x,_y) coordinates
        randColor = brickSettings.colors[randVal(0, brickSettings.colors.length - 1)];
        randBonus = false;
        if (Math.random() < bonusSettings.probability) {
            // decide randomly if a bonus will be given on the brick
            randBonus = true;
        }

        bricks.push({
            power:Math.floor(randVal(1,gameStats.level / 3)),
            x : _x,
            y : _y,
            xSpeed : brickSettings.xSpeed,
            ySpeed : brickSettings.ySpeed,
            width : brickSettings.width,
            height : brickSettings.height,
            margin : brickSettings.margin,
            color : randColor,
            hasBonus : randBonus
        });
        //createExplosion(_x,_y,randColor);
    }


    function generateBricks() {
        // generate bricks animation loop
        if ((bricks.length === brickSettings.count || brickSettings.rows === 0) && particles.length === 0) {
            // if reached required bricks count and finished all explosions, generate balls and start the next level
            generateBalls();
            clearInterval(generateBricksInterval);
            generateBricksInterval = null;
            gameOver = false;
            generatingBricks = false;
            startLevel();
        }

        if (bricks.length<brickSettings.count && brickSettings.rows) {
            // generate a new brick
            generateBrick(brickSettings.xCurrent, brickSettings.yCurrent);
            // advance the brick x position
            brickSettings.xCurrent += brickSettings.width + brickSettings.margin;
            if (brickSettings.xCurrent + brickSettings.width + brickSettings.margin>canvas.width*(0.9)) {
                // advance to the next row
                brickSettings.rows--;
                // start new row of bricks
                brickSettings.xCurrent = brickSettings.xStart; // reset the x position
                brickSettings.yCurrent += brickSettings.height + brickSettings.margin; // advance to the next row
            }
        }
        
        // draw explosions and bricks in the loop
        drawExplosions();
        drawBricks();
    }

    function autoTester() {
        // auto tester function for debugging purposes
        
        if (balls.length > 0) {
            // automatically goes to a ball location if it about to go out of the screen
            for (i = 0; i<balls.length; i++) {
                if (balls[i].y > canvas.height*0.9) {
                    // if(balls[i].x<xPaddle || balls[i].x>xPaddle+paddleWidth)
                    xPaddle = randVal(balls[i].x, balls[i].x - paddleWidth);
                }
            }
        }
        if (bonuses.length > 0) {
            // automatically goes to a bonus location if it about to go out of the screen
            for (i = 0; i<bonuses.length; i++) {
                if (bonuses[i].y > canvas.height*0.9) {
                    if (bonuses[i].x<xPaddle || bonuses[i].x>xPaddle + paddleWidth)
                        xPaddle = randVal(bonuses[i].x, bonuses[i].x - paddleWidth);
                }
            }
        }
    }

    function startLevel() {
        // resets the default starting settings of the level and starts it
        setCannons(false);
        cannonShots = [];
        gameLoop(); // call once to gameLoop to draw everything
        gamePaused = true;
        ctx.font = "12px 'Press Start 2P', Times New Roman";
        ctx.fillStyle = 'blue';
        ctx.fillText("Level " + gameStats.level, myCanvas.width*0.05, myCanvas.height*0.5);
        ctx.fillText("Tap Screen To Continue...", myCanvas.width*0.05, myCanvas.height*0.6);
        ctx.fillText("'P' To Continue...", myCanvas.width*0.05, myCanvas.height*0.7);
        clearInterval(gameInterval);
        gameInterval = null;
        if (tester) {
            resumeGame();
        }

        updateGameEventMessage("Started Level: " + gameStats.level);
    }

    function increaseLevel() {
        // increases the level difficulty settings
        gamePaused = true;
        gameStats.level++;

        // reset game settings
        paddleWidth = 75;
        paddleCannons = false;
        // reset to default ball settings
        ballSettings = Object.create(ballSettingsDefault);

        // decrease bonus drop probability
        bonusSettings.probability = Math.max(bonusSettings.minProb, bonusSettings.probability - bonusSettings.decreaseProb);

        // clear all bricks (happens if using debug menu)
        bricks = []; // reset the bricks array list
        // clear balls from previous level
        for (i = 0; i < balls.length; i++) {
            if (i % 10 === 0)
                createExplosion(balls[i].x, balls[i].y, balls[i].color);
            balls.splice(i, 1);
        }
        balls = []; // reset the balls array list

        // clear bonuses from previous level
        for (i = 0; i < bonuses.length; i++) {
            if (i % 10 === 0)
                createExplosion(bonuses[i].x, bonuses[i].y, bonuses[i].color);
            bonuses.splice(i, 1);
        }
        bonuses = []; // reset the bonuses array list


        clearInterval(gameInterval);
        gameInterval = null;

        // set new speed for the bricks
        brickSettings.xSpeed = Math.min(brickSettings.xMaxSpeed, Math.abs(brickSettings.xSpeed) + brickSettings.xIncrSpeed);
        brickSettings.xSpeed *= ((Math.random() < 0.5) ? -1 : 1); // randomly decide on starting direction (left/right)

        // reduce brick width
        brickSettings.width = Math.max(brickSettings.minWidth, brickSettings.width - 1);
        brickSettings.height = Math.max(brickSettings.minHeight, brickSettings.height - 1);

        // calculate how many bricks on each row
        calculateBricksCount(brickSettings);

        // reset starting point of bricks
        brickSettings.xCurrent = brickSettings.xStart;
        brickSettings.yCurrent = brickSettings.yStart;

        // start bricks generation sequence
        generatingBricks = true;
        generateBricksInterval = setInterval(generateBricks, drawBrickGenerationDelay);
    }

    function resetGame() {
        // reset the game settings (difficulty and variables) to the defaults
        drawBackground();
        balls = [];
        bricks = [];
        bonuses = [];

        paddleWidth = 75;
        paddleCannons = false;
        // deep copy the default game stats
        gameStats = Object.create(gameStatsDefault);

        // deep copy the default ball settings
        ballSettings = Object.create(ballSettingsDefault);

        // deep copy the default brick settings
        brickSettings = Object.create(brickSettingsDefault);

        // deep copy the default bonus settings
        bonusSettings = Object.create(bonusSettingsDefault);

        // calculate initial columns according to screen size
        calculateBricksCount(brickSettingsDefault);

        generatingBricks = true;
        generateBricksInterval = setInterval(generateBricks, drawBrickGenerationDelay);
    }

    function setIntroBricks() {
        // intro animation setup
        coordinates = [];
        xBrickOffset = 50;
        yBrickOffset = 10;
        B = [[20, 20], [20, 30], [20, 40], [20, 50], [20, 60], [20, 70], [20, 80], [30, 20], [30, 80], [40, 30], [40, 40], [30, 50], [40, 60], [40, 70]];
        U = [[60, 20], [60, 30], [60, 40], [60, 50], [60, 60], [60, 70], [70, 80], [80, 80], [90, 70], [90, 20], [90, 30], [90, 40], [90, 50], [90, 60], [90, 70], [70, 80]];
        R = [[110, 20], [110, 30], [110, 40], [110, 50], [110, 60], [110, 70], [110, 80], [120, 20], [130, 30], [130, 40], [120, 50], [130, 60], [130, 70], [130, 80]];
        E = [[150, 20], [150, 30], [150, 40], [150, 50], [150, 60], [150, 70], [150, 80], [160, 20], [170, 20], [160, 50], [170, 50], [160, 80], [170, 80]];
        Y = [[190, 20], [200, 30], [210, 40], [220, 30], [230, 20], [210, 50], [210, 60], [210, 70], [210, 80]];
        coordinates = coordinates.concat(B);
        coordinates = coordinates.concat(U);
        coordinates = coordinates.concat(R);
        coordinates = coordinates.concat(E);
        coordinates = coordinates.concat(Y);
        _width = 10;
        _height = 10;
        for (i = 0; i < coordinates.length; i++) {
            bricks.push({
                power:3,
                x : coordinates[i][0] + xBrickOffset,
                y : coordinates[i][1] + yBrickOffset,
                xSpeed : 1,
                ySpeed : brickSettings.ySpeed,
                width : _width,
                height : _height,
                margin : brickSettings.margin,
                color : "green",
                hasBonus : false
            });
        }
    }

    function intro() {
        // intro animation loop
        drawBackground();
        drawBalls();
        drawPaddle('blue');
        checkBricksDirection();
        updateBricksPosition();
        drawBricks();
        updateBallPositions();
        checkCollisions();
        if (predictive) {
            drawPredictiveLines();
        }
        if (tester) {
            autoTester();
        }
        ctx.font = "15px 'Press Start 2P', Times New Roman";
        ctx.fillStyle = 'blue';
        ctx.fillText("Breakout", myCanvas.width*0.1, myCanvas.height*0.4);
        ctx.fillText("Coded By Burey", myCanvas.width*0.1, myCanvas.height*0.5);

        ctx.font = "10px 'Press Start 2P', Times New Roman";
        ctx.fillStyle = 'red';
        ctx.fillText("Inspired by Blaine P", myCanvas.width*0.1, myCanvas.height*0.7);
        keyMovementUpdate();
        if (bricks.length === 0) {
            createExplosion(randVal(0, canvas.width), randVal(0, canvas.height), brickSettings.colors[randVal(0, brickSettings.colors.length - 1)]);
        }
        if (particles.length > 0) {
            drawExplosions();
        }
    }

    function drawBackground() {
        ctx.fillStyle = "grey";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function gameLoop() {
        // main game loop
        // call each drawing/checking function in it's turn
        drawBackground();
        updateDisplayValues();

        if (bricks.length === 0) {
            addScore(gameStats.pointsPerBall*balls.length);
            increaseLevel();
        }

        if (bonuses.length > 0) {
            checkBonuses();
            drawBonuses();
        }

        keyMovementUpdate();
        checkBricksDirection();
        updateBricksPosition();
        drawBalls();
        drawPaddle('blue');
        drawBricks();
        drawShots();
        if (particles.length > 0) {
            drawExplosions();
        }
        checkGameOver();
        updateBallPositions();
        checkCollisions();
        checkShotsHits();
        if (predictive) {
            drawPredictiveLines();
        }
        if (tester) {
            autoTester();
        }
        //console.log("Ball Count: "+balls.length+"\nBrick Count: "+bricks.length+"\nBonuses: "+bonuses.length+"\nPaddle Length: "+paddleWidth);
    }
    // bind gameInterval to setInterval so we can use clearInterval on it when game over occurs
    generateBalls();
    //console.log("Welcome To Breakout!!!\npress New Game button to start a new game\nTilt phone to move the paddle\nClick on the game area to pause/resume the game");
    alert(introMesg); // show intro message
    setIntroBricks(); // set the intro animation bricks (BUREY)
    introInterval = setInterval(intro, drawDelay); // start the intro animation
}
// wait for the entire html file to load before starting to load the game
// the function init then initializes variables and starts the game
window.onload = init;
