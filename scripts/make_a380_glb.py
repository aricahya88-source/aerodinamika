#!/usr/bin/env python3
"""Generate an original lightweight A380-inspired teaching GLB.
This is NOT the Airbus engineering CAD nor a substitute for the CC-BY external model.
Uses trimesh during project authoring only; not required by the website runtime.
"""
from collections import defaultdict
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

out=Path(__file__).resolve().parents[1]/'assets/models/a380-aerolab.glb'
out.parent.mkdir(parents=True,exist_ok=True)
groups=defaultdict(list)
colors={
 'fuselage':(239,246,250,255),'wing':(217,226,236,255),'metal':(115,135,151,255),
 'window':(29,65,85,255),'intake':(26,37,49,255),'tire':(25,32,39,255),
 'accent':(26,111,163,255),'tail':(22,61,105,255),'hub':(187,205,219,255)
}

def add(mesh,group):
 if isinstance(mesh,trimesh.Trimesh):groups[group].append(mesh)
def ellipsoid(c,sc,group,sub=2):
 m=trimesh.creation.icosphere(subdivisions=sub);m.apply_scale(sc);m.apply_translation(c);add(m,group)
def cylinder(c,r,h,group,axis='z',sections=16):
 m=trimesh.creation.cylinder(radius=r,height=h,sections=sections)
 if axis=='z':m.apply_transform(trimesh.transformations.rotation_matrix(np.pi/2,[1,0,0]))
 elif axis=='x':m.apply_transform(trimesh.transformations.rotation_matrix(np.pi/2,[0,0,1]))
 m.apply_translation(c);add(m,group)
def box(c,dimensions,group):
 m=trimesh.creation.box(extents=dimensions);m.apply_translation(c);add(m,group)
def prism(points,thickness,group):
 # points: list xyz vertices around outline. each face with thickness in Y
 top=[(x,y+thickness/2,z) for x,y,z in points]
 bot=[(x,y-thickness/2,z) for x,y,z in points]
 n=len(points);v=np.array(top+bot,dtype=float);f=[]
 for i in range(1,n-1):f.append((0,i,i+1));f.append((n,n+i+1,n+i))
 for i in range(n):j=(i+1)%n;f.append((i,j,n+j));f.append((i,n+j,n+i))
 m=trimesh.Trimesh(vertices=v,faces=np.array(f),process=True);add(m,group)
# Body fuselage accurate full-length bounds +/-36.35 m and 7.14 m midship width.
rings=[(-36.35,.08,.10,1.2),(-35.0,1.3,1.6,.7),(-31,2.5,2.6,0),(-24,3.47,3.75,0),
 (-10,3.55,3.87,0),(12,3.55,3.87,0),(26,3.5,3.83,0),(31.3,2.8,2.9,-.25),
 (33.5,2.15,2.32,-.45),(35.3,1.25,1.15,-.5),(36.35,.05,.06,-.6)]
count=28;verts=[]
for z,rx,ry,cy in rings:
 for k in range(count):
  a=2*np.pi*k/count;verts.append((rx*np.cos(a),cy+ry*np.sin(a),z))
f=[]
for j in range(len(rings)-1):
 for k in range(count):
  a=j*count+k;b=j*count+(k+1)%count;c=(j+1)*count+k;d=(j+1)*count+(k+1)%count
  f.extend([(a,c,b),(b,c,d)])
add(trimesh.Trimesh(vertices=verts,faces=f,process=True),'fuselage')
# Double deck bulge, contoured separate shell stays within real width envelope.
ellipsoid([0,2.42,8.8],[3.0,1.75,24.0],'fuselage',3)
# Windshields and two cabin rows.
for s in [-1,1]:
 for z in np.arange(-24,26,1.7):
  ellipsoid((s*3.54,.85,z),(.065,.17,.33),'window',1)
  if -10<z<25:ellipsoid((s*3.15,3.15,z),(.07,.16,.29),'window',1)
 ellipsoid((s*1.14,1.58,34.45),(1.12,.48,.18),'window',2)
 # doors
 for z in [17,-13]:box((s*3.55,.35,z),(.07,1.76,1.0),'metal')
# Main wing (approximate planform, not engineering-accurate)
for s in [-1,1]:
 prism([(s*2.7,-.6,14),(s*9,-.6,12),(s*39.87,.65,-12.3),(s*39.87,.65,-17.1),(s*11,-.5,-19.0),(s*2.8,-.5,-14.8)],.64,'wing')
 prism([(s*3.0,-.22,13.7),(s*9,-.22,11.5),(s*39.5,.7,-12.45),(s*39.4,.7,-13.1),(s*9,-.25,9.3)],.10,'metal')
 # flap / control surface impressions
 prism([(s*11,-.68,-16.0),(s*27,-.35,-18.1),(s*26,-.35,-18.9),(s*11,-.68,-19.3)],.08,'metal')
 # wingtip fence
 box((s*39.45,1.13,-14.6),(.4,2.25,2.2),'accent')
 # horizontal stabilizers
 prism([(s*.65,1.8,-26.6),(s*14.45,2.9,-33.1),(s*14.4,2.9,-36.3),(s*.85,1.8,-36.6)],.34,'wing')
 # twin turbofans under each wing
 for x,z in [(12,2.0),(25.5,-6.5)]:
  xx=s*x
  ellipsoid((xx,-3.25,z), (2.16,2.16,4.45),'fuselage',3)
  cylinder((xx,-3.25,z+3.45),1.96,.34,'metal')
  cylinder((xx,-3.25,z+3.64),1.62,.08,'intake')
  cylinder((xx,-3.25,z+3.7),.42,.15,'hub')
  box((xx,-1.35,z-1),(.75,2.1,2),'metal')
# Tail fin vertical upright: construct as thick prism extruded along X.
outline=[(0,1,-28),(0,17.8,-34.2),(0,17.7,-37.0),(0,1,-36.8)]
verts=[(-.18,y,z) for x,y,z in outline]+[(.18,y,z) for x,y,z in outline]
faces=[(0,1,2),(0,2,3),(4,6,5),(4,7,6)]
for i in range(4):j=(i+1)%4;faces.extend([(i,j,4+j),(i,4+j,4+i)])
add(trimesh.Trimesh(vertices=verts,faces=faces,process=True),'tail')
# Gear visual: 22 wheel simplified, struts.
for side in [-1,1]:
 for x,zz in [(side*8.1,z) for z in [-6.1,-8.4,-10.7,-13]] +[(side*3.0,z) for z in [-5,-7.0,-9.0,-11.0,-13.0,-15.0]]:
  cylinder((x,-8.25,zz),.89,.55,'tire','x');cylinder((x,-8.25,zz),.34,.58,'metal','x');
  box((x,-6.2,zz),(.12,3.6,.13),'metal')
 for zz in [27.5]:
  cylinder((side*1.05,-8.25,zz),.75,.45,'tire','x');cylinder((side*1.05,-8.25,zz),.29,.47,'metal','x')
# narrow paint swatch embedded into fuselage; runtime livery overlays take precedence
for s in [-1,1]:
 ellipsoid((s*3.58,1.08,6.5),(.08,.2,23),'accent',2)
scene=trimesh.Scene()
for group,meshes in groups.items():
 merged=trimesh.util.concatenate(meshes)
 merged.visual=trimesh.visual.TextureVisuals(material=PBRMaterial(name=group,baseColorFactor=colors[group],metallicFactor=.07,roughnessFactor=.6))
 scene.add_geometry(merged,geom_name=group,node_name=group)
out.write_bytes(scene.export(file_type='glb'))
print(f'GLB generated: {out} {out.stat().st_size} bytes, {len(groups)} material meshes')
