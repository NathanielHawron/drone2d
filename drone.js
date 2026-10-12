class Vec2{
    constructor(x, y){
        this.x = x ?? 0;
        this.y = y ?? 0;
    }
    add(v){
        return new Vec2(this.x+v.x, this.y+v.y);
    }
    sub(v){
        return new Vec2(this.x-v.x, this.y-v.y);
    }
    mult(s){
        return new Vec2(this.x*s, this.y*s);
    }
    str(){
        return "("+Math.round(this.x*10000)/10000+","+Math.round(this.y*10000)/10000+")";
    }
}
class Position{
    constructor(x,y,r){
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.r = r ?? 0;
    }
    add(v){
        return new Position(this.x+v.x, this.y+v.y, this.r+v.r);
    }
    sub(v){
        return new Position(this.x-v.x, this.y-v.y, this.r-v.r);
    }
    mult(s){
        return new Position(this.x*s, this.y*s, this.r*s);
    }
    str(){
        return "("+Math.round(this.x*10000)/10000+","+Math.round(this.y*10000)/10000+")";
    }
}
function multMat(A, B){
    if (A[0].length !== B.length) {
        throw new Error("Incompatible matrix dimensions");
    }

    const rows = A.length;
    const cols = B[0].length;
    const common = B.length;

    const result = Array.from(
        { length: rows },
        () => Array(cols).fill(0)
    );

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            for (let k = 0; k < common; k++) {
                result[i][j] += A[i][k] * B[k][j];
            }
        }
    }

    return result;
}
function multMatColVec(A, v){
    if (A[0].length !== v.length) {
        throw new Error("Incompatible matrix dimensions");
    }

    const rows = A.length;
    const cols = v.length;

    const result = Array(rows).fill(0);

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            result[i] += A[i][j] * v[j];
        }
    }

    return result;
}
class Drone{
    constructor(size, mass, inertia, com, power, off, regulator, color, integrators){
        this.pos = new Position();
        this.vel = new Position();
        this.posRef = new Vec2();
        this.wind = new Vec2();
        this.g = new Vec2(0,-9.81);
        this.size = size;
        this.mass = mass;
        this.inertia = inertia;
        this.com = com;
        this.off = off;
        this.power = power;
        this.powL = 0;
        this.powR = 0;
        this.regulator = regulator;
        this.color = color;
        this.target = [0,0,0,0,0,0];
        this.settled = new Date();
        this.settlingTime = Infinity;

        this.integrator = [];
        for(let i=0;i<integrators ?? 0;++i){
            this.integrator.add(0);
        }
    }
    reset(){
        this.pos = new Position();
        this.vel = new Position();
        this.posRef = new Vec2();
        this.wind = new Vec2();
        this.g = new Vec2(0,-9.81);
        this.target = [0,0,0,0,0,0];
        this.settled = new Date();
        this.settlingTime = Infinity;
    }
    setTarget(px, py, vx, vy, a, w){
        this.target = [px,py,vx,vy,a,w];
    }
    regulate(dt){
        if(typeof(this.regulator) === typeof(()=>{})){
            let e = [-this.pos.x,-this.pos.y,-this.vel.x,-this.vel.y,-this.pos.r,-this.vel.r];
            for(let i=0;i<e.length;++i){
                e[i] += this.target[i];
            }
            if(dt < maxdt){
                let es = [e[0]*10, e[1]*10, e[2]*100, e[3]*100, e[4]*180/Math.pi, e[5]*180/Math.PI];
                let norm1 = 0;
                for(let dimension of es){
                    if(Math.abs(dimension) > norm1){
                        norm1 = Math.abs(dimension);
                    }
                }
                if(norm1 < 1){
                    let now = new Date();
                    let time = now - this.settled;
                    if(time > 100){
                        console.log(e,time);
                        this.settlingTime = time;
                    }
                    this.settled = now;
                }
            }else{
                this.settled = new Date();
            }
            let powers = this.regulator(e, this.pos.r, this.power*2/this.mass);
            let left = powers[0]/2.0 + powers[1]/2.0;
            let right = powers[0]/2.0 - powers[1]/2.0;

            if(typeof(powers) === typeof([])){
                this.control(left*this.mass, right*this.mass);
            }
        }
    }
    control(powL, powR){
        this.powL = Math.max(Math.min(powL ?? this.powL, this.power),0);
        this.powR = Math.max(Math.min(powR ?? this.powR, this.power),0);
    }
    update(dt){
        let acc = new Position(this.g.x,this.g.y);

        let up = new Vec2(Math.sin(this.pos.r),Math.cos(this.pos.r));
        acc.r += (this.powL-this.powR)*this.off.x / this.inertia;
        acc.x += up.x * (this.powR + this.powL) / this.mass;
        acc.y += up.y * (this.powR + this.powL) / this.mass;

        this.vel.x += this.wind.x*dt;
        this.vel.y += this.wind.y*dt;
        this.pos = this.pos.add(this.vel.mult(dt).add(acc.mult(dt*dt*0.5)));
        this.vel = this.vel.add(acc.mult(dt));
    }
    render(ctx){
        let transform = ctx.getTransform();
        ctx.fillStyle = this.color;
        ctx.translate(this.pos.x,this.pos.y);
        ctx.rotate(-this.pos.r);
        ctx.beginPath();
        ctx.fillRect(-this.size.x*0.5,-this.size.y*0.5,this.size.x,this.size.y);
        ctx.ellipse(-this.off.x,this.off.y,0.4,0.05,0,0,2*Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.off.x,this.off.y,0.4,0.05,0,0,2*Math.PI);
        ctx.fill();
        ctx.setTransform(transform);
    }
    display(posDisp, velDisp, rotDisp, rotvDisp, windDisp, contDisp, settlingDisp){
        posDisp.innerHTML = "Pos: "+this.pos.str();
        velDisp.innerHTML = "Vel: "+this.vel.str();
        rotDisp.innerHTML = "Rot: "+Math.round(this.pos.r*18000/Math.PI)/100 + "&deg;";
        rotvDisp.innerHTML = "RotV: "+Math.round(this.vel.r*18000/Math.PI)/100 + "&deg;/s";
        windDisp.innerHTML = "Wind: "+this.wind.str();
        contDisp.innerHTML = "Control: "+Math.round(this.powL*10000)/10000 + ", " + Math.round(this.powR*10000)/10000;
        let now = new Date();
        let time = now - this.settled;
        settlingDisp.innerHTML = "Settling Time: "+(this.settlingTime===Infinity ? "&infin;" : this.settlingTime) + "ms" + (time>100?"*":"");
    }
}