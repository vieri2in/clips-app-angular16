import { Component, OnDestroy } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import {
  AngularFireStorage,
  AngularFireUploadTask,
} from "@angular/fire/compat/storage";
import { v4 as uuid } from "uuid";
import { last, switchMap } from "rxjs/operators";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import firebase from "firebase/compat/app";
import { ClipService } from "src/app/services/clip.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-upload",
  templateUrl: "./upload.component.html",
  styleUrls: ["./upload.component.css"],
})
export class UploadComponent implements OnDestroy {
  isDragOver = false;
  isToNextStep = false;
  showAlert = false;
  alertColor = "blue";
  alertMsg = "Please wait. Your clip is being uploaded.";
  inSubmission = false;
  file: File | null = null;
  percentage = 0;
  showPercentage = false;
  user: firebase.User | null = null;
  title = new FormControl("", {
    validators: [Validators.required, Validators.minLength(3)],
    nonNullable: true,
  });
  uploadForm = new FormGroup({
    title: this.title,
  });
  task?: AngularFireUploadTask;
  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipsService: ClipService,
    private router: Router
  ) {
    auth.user.subscribe((user) => (this.user = user));
  }
  storeFile(event: Event) {
    // console.log(event);
    this.isDragOver = false;
    this.file = (event as DragEvent).dataTransfer
      ? (event as DragEvent).dataTransfer?.files.item(0) ?? null
      : (event.target as HTMLInputElement).files?.item(0) ?? null;
    if (!this.file || this.file.type !== "video/mp4") {
      return;
    }
    this.title.setValue(this.file.name.replace(/\.[^/.]+$/, ""));
    this.isToNextStep = true;
  }
  uploadFile() {
    this.uploadForm.disable();
    this.inSubmission = true;
    this.showAlert = true;
    this.alertColor = "blue";
    this.alertMsg = "Please wait. Your clip is being uploaded.";
    this.showPercentage = true;
    const clipFileName = uuid();
    const clipPath = `clips/${clipFileName}.mp4`;
    this.task = this.storage.upload(clipPath, this.file);
    // console.log("File uploaded");
    const clipRef = this.storage.ref(clipPath);
    this.task.percentageChanges().subscribe((prgress) => {
      this.percentage = (prgress as number) / 100;
    });
    this.task
      .snapshotChanges()
      .pipe(
        last(),
        switchMap(() => clipRef.getDownloadURL())
      )
      .subscribe({
        next: async (url) => {
          const clip = {
            uid: this.user?.uid as string,
            displayName: this.user?.displayName as string,
            title: this.title.value,
            fileName: `${clipFileName}.mp4`,
            url,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          };
          // console.log(clip);
          const clipDocRef = await this.clipsService.creatClip(clip);
          this.alertColor = "green";
          this.alertMsg = "Success! Your clip is ready to share with others.";
          this.showPercentage = false;
          this.inSubmission = false;
          setTimeout(() => {
            this.router.navigate(["clip", clipDocRef.id]);
          }, 1000);
        },
        error: (error) => {
          this.uploadForm.enable();
          this.inSubmission = false;
          this.alertColor = "red";
          this.alertMsg = "Upload falied. Please try it again later.";
          this.showPercentage = false;
          console.log(error);
        },
      });
  }
  ngOnDestroy(): void {
    this.task?.cancel();
  }
}
// oW0X8wcI07bF0Pv40aMoGjncYQ33
