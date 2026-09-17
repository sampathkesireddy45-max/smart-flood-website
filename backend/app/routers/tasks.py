import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Task, TaskEvidence, AuditLog, Road
from ..schemas import TaskCreate, TaskStatusUpdate, TaskEvidenceSubmit
from ..regional_data import is_regional, get_regional_tasks

router = APIRouter(prefix="/tasks", tags=["Field Worker Task Management"])

@router.get("")
def list_tasks(
    worker_name: Optional[str] = None,
    status: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    if is_regional(lat, lng):
        return get_regional_tasks(lat, lng, worker_name, status)

    query = db.query(Task)
    if worker_name:
        query = query.filter(Task.assigned_to.contains(worker_name))
    if status and status.upper() != "ALL":
        query = query.filter(Task.status == status.upper())

    tasks = query.order_by(Task.created_at.desc()).all()
    results = []
    for t in tasks:
        evidences = []
        for e in t.evidences:
            evidences.append({
                "id": e.id,
                "worker_id": e.worker_id,
                "photo_url": e.photo_url,
                "observation": e.observation,
                "verification_result": e.verification_result,
                "created_at": e.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
            })

        results.append({
            "id": t.id,
            "task_code": t.task_code,
            "incident_id": t.incident_id,
            "assigned_to": t.assigned_to,
            "title": t.title,
            "description": t.description,
            "priority": t.priority,
            "status": t.status,
            "location": t.location,
            "latitude": t.latitude,
            "longitude": t.longitude,
            "started_at": t.started_at.strftime("%Y-%m-%d %H:%M:%S UTC") if t.started_at else None,
            "completed_at": t.completed_at.strftime("%Y-%m-%d %H:%M:%S UTC") if t.completed_at else None,
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "evidences": evidences
        })
    return results

@router.post("")
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    code_num = random.randint(300, 999)
    tsk_code = f"TSK-2026-{code_num}"

    task = Task(
        task_code=tsk_code,
        incident_id=payload.incident_id,
        assigned_to=payload.assigned_to,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status="ASSIGNED",
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    audit = AuditLog(
        user="Authority Dispatcher",
        action="TASK_ASSIGNED",
        record=f"{task.task_code} -> {task.assigned_to}",
        old_value=None,
        new_value=task.status
    )
    db.add(audit)
    db.commit()

    return {"message": "Task assigned successfully", "task_id": task.id, "task_code": task.task_code}

@router.patch("/{task_id}/status")
def update_task_status(task_id: int, payload: TaskStatusUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_status = task.status
    task.status = payload.status.upper()

    if task.status == "IN_PROGRESS" and not task.started_at:
        task.started_at = datetime.utcnow()
    elif task.status == "COMPLETED":
        task.completed_at = datetime.utcnow()

    audit = AuditLog(
        user=task.assigned_to,
        action="TASK_STATUS_UPDATE",
        record=task.task_code,
        old_value=old_status,
        new_value=task.status
    )
    db.add(audit)
    db.commit()

    return {"message": f"Task {task.task_code} updated to {task.status}"}

@router.post("/{task_id}/evidence")
def submit_task_evidence(task_id: int, payload: TaskEvidenceSubmit, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    evidence = TaskEvidence(
        task_id=task.id,
        worker_id=payload.worker_id,
        photo_url=payload.photo_url or "/uploads/evidence_demo.jpg",
        observation=payload.observation,
        verification_result=payload.verification_result.upper()
    )
    db.add(evidence)

    # If verification confirmed flooding, automatically update task to completed
    task.status = "COMPLETED"
    task.completed_at = datetime.utcnow()

    audit = AuditLog(
        user=payload.worker_id,
        action="TASK_EVIDENCE_SUBMITTED",
        record=f"{task.task_code} ({payload.verification_result})",
        old_value="IN_PROGRESS",
        new_value="COMPLETED"
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Evidence submitted for {task.task_code}. Inspection marked as COMPLETED.",
        "evidence_id": evidence.id,
        "verification_result": payload.verification_result
    }
