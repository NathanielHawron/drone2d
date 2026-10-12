const fpv = document.getElementById("fpv");
const ctx = fpv.getContext("2d");

const posDisp = document.getElementById("pos");
const velDisp = document.getElementById("vel");
const rotDisp = document.getElementById("rot");
const rotvDisp = document.getElementById("rotV");
const windDisp = document.getElementById("wind");
const contDisp = document.getElementById("cont");
const settlingDisp = document.getElementById("sett");

const targetPX = document.getElementById("tpx");
const targetPY = document.getElementById("tpy");
const targetVX = document.getElementById("tvx");
const targetVY = document.getElementById("tvy");
const targetA = document.getElementById("ta");
const targetW = document.getElementById("tw");

const updateButton = document.getElementById("updateTarget");
const updateAllButton = document.getElementById("updateAllTarget");

const droneSelectSlider = document.getElementById("droneSelect");
const droneResetButton = document.getElementById("resetDrone");
const droneResetAllButton = document.getElementById("resetAllDrone");


window.onresize = ()=>{
    fpv.width = fpv.clientWidth;
    fpv.height = fpv.clientHeight;
}
window.onresize();

let drones = [];
let droneSelect = 0;

let prevTime = new Date();

let scale = 0.02;
let maxdt = 0.1;

let targets = [];


/*document.onkeydown = (e)=>{
    switch(e.key){
        case 'w':{
            drone.control(15, 15);
        }break;
        case 'a':{
            drone.control(2, 15);
        }break;
        case 'd':{
            drone.control(15, 2);
        }break;
    }
}
document.onkeyup = (e)=>{
    switch(e.key){
        case 'w':{
            drone.control(0,0);
        }break;
        case 'a':{
            drone.control(0,0);
        }break;
        case 'd':{
            drone.control(0,0);
        }break;
    }
}*/
updateButton.onclick = ()=>{
    targets[0] = Number.parseFloat(targetPX.value) || 0;
    targets[1] = Number.parseFloat(targetPY.value) || 0;
    targets[2] = Number.parseFloat(targetVX.value) || 0;
    targets[3] = Number.parseFloat(targetVY.value) || 0;
    targets[4] = Number.parseFloat(targetA.value) || 0;
    targets[5] = Number.parseFloat(targetW.value) || 0;

    let mainDrone = drones[droneSelect];
    if(mainDrone != undefined){
        mainDrone.setTarget(...targets);
    }
}
updateAllButton.onclick = ()=>{
    targets[0] = Number.parseFloat(targetPX.value) || 0;
    targets[1] = Number.parseFloat(targetPY.value) || 0;
    targets[2] = Number.parseFloat(targetVX.value) || 0;
    targets[3] = Number.parseFloat(targetVY.value) || 0;
    targets[4] = Number.parseFloat(targetA.value) || 0;
    targets[5] = Number.parseFloat(targetW.value) || 0;

    for(let drone of drones){
        drone.setTarget(...targets);
    }
}
droneResetButton.onclick = ()=>{
    let mainDrone = drones[droneSelect];
    if(mainDrone != undefined){
        mainDrone.reset();
    }
}
droneResetAllButton.onclick = ()=>{
    for(let drone of drones){
        drone.reset();
    }
}
droneSelectSlider.oninput = ()=>{
    droneSelectSlider.max = drones.length-1;
    let mainDrone = drones[droneSelectSlider.value];
    if(mainDrone != undefined){
        droneSelectSlider.style.accentColor = mainDrone.color;
    }
}
droneSelectSlider.onchange = ()=>{
    droneSelect = droneSelectSlider.value;
}
let subframes = 10;
setInterval(()=>{
    ctx.resetTransform();
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,fpv.width,fpv.height);
    ctx.translate(fpv.width*0.5, fpv.height*0.5);
    ctx.scale(fpv.height*0.5*scale,-fpv.height*0.5*scale);
    
    let now = new Date();
    let dt = Math.min((now - prevTime)/1000, maxdt);
    prevTime = now;


    let sdt = dt/subframes;
    for(let i=0;i<subframes;++i){
        for(drone of drones){
            drone.regulate(dt);
            drone.update(sdt);
        }
    }
    for(drone of drones){
        drone.render(ctx);
    }
    let mainDrone = drones[droneSelect];
    if(mainDrone != undefined){
        mainDrone.display(posDisp, velDisp, rotDisp, rotvDisp, windDisp, contDisp, settlingDisp);
    }
},10);