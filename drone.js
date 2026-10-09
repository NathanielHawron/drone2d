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
        return "("+this.x+","+this.y+")";
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
        return "("+this.x+","+this.y+")";
    }
}
class Drone{
    constructor(size, mass, com, power, off, regulator, color){
        this.pos = new Position();
        this.vel = new Position();
        this.posRef = new Vec2();
        this.wind = new Vec2();
        this.g = new Vec2(0,-9.81);
        this.size = size;
        this.mass = mass;
        this.com = com;
        this.off = off;
        this.power = power;
        this.powL = 0;
        this.powR = 0;
        this.regulator = regulator || "LQR3"; // LQR1 LQR3 LQI1
        this.color = color;

        this.integrator = [0,0,0]
    }
    regulate(px, py, vx, vy, a, w, dt){
        let d = [px - this.pos.x, py - this.pos.y, vx - this.vel.x, vy - this.vel.y, a - this.pos.r, w - this.vel.r];
        this.integrator[0] += d[0]*dt;
        this.integrator[1] += d[1]*dt;
        this.integrator[2] += d[4]*dt;

        let T = 0; let D = 0;
        /*
        -pi/4 rad
           -0.4818    0.8763   -0.6716    1.6877   -2.2270   -0.3709
           -0.8763   -0.4818   -1.7340   -1.2095  -12.5180   -5.0891
        0 rad
            0         1.0000    0         1.7321  0           0
           -1.0000    0        -1.9383    0       -13.5088   -5.2932
        pi/4 rad
            0.4818    0.8763    0.6716    1.6877    2.2270    0.3709
           -0.8763    0.4818   -1.7340    1.2095  -12.5180   -5.0891
        */
        switch(this.regulator){
        case "LQR1":{
            T =  0*d[0] +1*d[1] +0*d[2]      +1.7321*d[3] +0*d[4]       +0*d[5];
            D = -1*d[0] +0*d[1] -1.9383*d[2] +0*d[3]      -13.5088*d[4] -5.2903*d[5];
            T+=4.905;
            T = Math.max(Math.min(T, this.power*0.75), this.power*0.1);
            D = Math.max(Math.min(D, this.power*0.5), -this.power*0.5);
            let t = this.pos.r / (Math.PI/4);
            if(Math.abs(t)>1){
                let tr = Math.min(Math.abs(t)-1,1);
                T = (1-tr)*T + tr*0.5*this.power;
                D = (1-tr)*D + (t>0?tr:-tr)*this.power;
            }
        }break;
        case "LQR3":{
            let kT = [
                [-0.4818, 0.8763,-0.6716, 1.6877,-2.2270,-0.3709],
                [0,       1,      0,      1.7321, 0,      0     ],
                [0.4818,  0.8763, 0.6716, 1.6877, 2.2270, 0.3709]
            ];
            let kD = [
                [-0.8763,-0.4818,-1.7340,-1.2095,-12.5180,-5.0891],
                [-1,      0,     -1.9383, 0,     -13.5088,-5.2932],
                [-0.8763, 0.4818,-1.7340, 1.2095,-12.5180,-5.0891]
            ];
    
            let t = this.pos.r / (Math.PI/4);
            let W = [Math.max(Math.min(-0.5*t+0.5*t*t,0),1), Math.max(Math.min(1-t*t,0),1), Math.max(Math.min(0.5*t+0.5*t*t,0),1)];
            
            for(let i=0;i<6;++i){
                for(let j=0;j<3;++j){
                    T += d[i] * kT[j][i]*W[j];
                    D += d[i] * kD[j][i]*W[j];
                }
            }
   
            T+=4.905;
    
            T = Math.max(Math.min(T, this.power*0.75), this.power*0.1);
            D = Math.max(Math.min(D, this.power*0.5), -this.power*0.5);

            if(Math.abs(t)>1){
                let tr = Math.min(Math.abs(t)-1,1);
                T = (1-tr)*T + tr*0.5*this.power;
                D = (1-tr)*D + (t>0?tr:-tr)*this.power;
            }
        }break;
        case "LQI1":{
            /*
                0       2.4142  0       2.4142  0         0       0      1.0000
               -2.6666  0      -3.0555  0      -17.5721  -6.0120 -1.0000 0
            */
            T =  0*d[0]     +2.4142*d[1]+0*d[2]      +2.4142*d[3] +0*d[4]       +0*d[5];
            D = -2.6666*d[0]+0*d[1]     -3.0555*d[2] +0*d[3]      -17.5721*d[4] -6.0120*d[5];
            
            T += Math.min(Math.max(0*this.integrator[0] + 1*this.integrator[1], 0),20);
            D += Math.min(Math.max(-1*this.integrator[0] + 0*this.integrator[1], -20),20);

            T+=4.905;
            T = Math.max(Math.min(T, this.power*0.75), this.power*0.1);
            D = Math.max(Math.min(D, this.power*0.25), -this.power*0.25);
            let t = this.pos.r / (Math.PI/4);
            if(Math.abs(t)>1){
                let tr = Math.min(Math.abs(t)-1,1);
                T = (1-tr)*T + tr*0.5*this.power;
                D = (1-tr)*D + (t>0?tr:-tr)*this.power;
            }
        }break;
        }
        
        this.control(T-D, T+D)
    }
    control(powL, powR){
        this.powL = Math.max(Math.min(powL ?? this.powL, this.power),0);
        this.powR = Math.max(Math.min(powR ?? this.powR, this.power),0);
    }
    update(dt){
        let acc = new Position(this.g.x,this.g.y);

        let up = new Vec2(Math.sin(this.pos.r),Math.cos(this.pos.r));
        acc.r += (this.powL-this.powR)*this.off.x;
        acc.x += up.x * (this.powR + this.powL);
        acc.y += up.y * (this.powR + this.powL);

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
    display(posDisp, velDisp, rotDisp, rotvDisp, windDisp, contDisp){
        posDisp.innerText = "Pos: "+this.pos.str();
        velDisp.innerText = "Vel: "+this.vel.str();
        rotDisp.innerText = "Rot: "+this.pos.r;
        rotvDisp.innerText = "RotV: "+this.vel.r;
        windDisp.innerText = "Wind: "+this.wind.str();
        contDisp.innerText = "Control: "+this.powL + ", " + this.powR;
    }
}