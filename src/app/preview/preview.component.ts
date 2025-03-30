import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {PaperService} from '../../service/paper.service';
import {Paper} from '../../models/paper';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [NgIf],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss'
})
export class PreviewComponent implements OnInit {

  paperDetails: Paper | null = null

  constructor(private activatedRoutes: ActivatedRoute, private paperService: PaperService) {
  }

  ngOnInit() {
    this.fetchPaperDetails(this.activatedRoutes.snapshot.params['id']);
  }

  fetchPaperDetails(paperId: number) {
    this.paperService.getPaperDetails(paperId).subscribe(value => {
      this.paperDetails = value.data;
    })
  }
}
