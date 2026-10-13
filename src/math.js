// Pure vector + quaternion operations; independent of Babylon.js.
export const V = (x=0,y=0,z=0) => ({x,y,z});
export const add=(a,b)=>V(a.x+b.x,a.y+b.y,a.z+b.z);
export const sub=(a,b)=>V(a.x-b.x,a.y-b.y,a.z-b.z);
export const scale=(a,k)=>V(a.x*k,a.y*k,a.z*k);
export const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
export const cross=(a,b)=>V(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
export const length=(a)=>Math.hypot(a.x,a.y,a.z);
export const normal=(a)=>scale(a,1/Math.max(length(a),1e-8));
export const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const rad=(d)=>d*Math.PI/180;
export const deg=(r)=>r*180/Math.PI;
export const Q=(x=0,y=0,z=0,w=1)=>({x,y,z,w});
export function rotate(v,q){
  const u=V(q.x,q.y,q.z);
  const t=scale(cross(u,v),2);
  return add(add(v,scale(t,q.w)),cross(u,t));
}
export function invRotate(v,q){return rotate(v,Q(-q.x,-q.y,-q.z,q.w));}
export function integrateQuaternion(q,omega,dt){
  const h=dt*0.5;
  const x=q.x+h*( q.w*omega.x+q.y*omega.z-q.z*omega.y);
  const y=q.y+h*( q.w*omega.y+q.z*omega.x-q.x*omega.z);
  const z=q.z+h*( q.w*omega.z+q.x*omega.y-q.y*omega.x);
  const w=q.w-h*( q.x*omega.x+q.y*omega.y+q.z*omega.z);
  const n=1/Math.hypot(x,y,z,w);
  return Q(x*n,y*n,z*n,w*n);
}
export function eulerFromQuaternion(q){
  // Rotation in world coordinates: pitch around X, yaw around Y, roll around Z.
  const forward=rotate(V(0,0,1),q);
  const right=rotate(V(1,0,0),q);
  return {
    pitch:deg(Math.atan2(forward.y,Math.hypot(forward.x,forward.z))),
    heading:(deg(Math.atan2(forward.x,forward.z))+360)%360,
    bank:deg(Math.atan2(-right.y,Math.hypot(right.x,right.z)))
  };
}
