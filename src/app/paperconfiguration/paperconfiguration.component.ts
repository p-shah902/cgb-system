
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import { PaperConfigService } from '../../service/paper/paper-config.service';
import { PaperFilter } from '../../models/general';
import { PaperConfig } from '../../models/paper';
import {Select2} from 'ng-select2-component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Router} from '@angular/router';

@Component({
  selector: 'app-paperconfiguration',
  standalone: true,
  imports: [CommonModule,Select2],
  templateUrl: './paperconfiguration.component.html',
  styleUrl: './paperconfiguration.component.scss'
})
export class PaperconfigurationComponent implements OnInit{

  private paperService=inject(PaperConfigService);
  private router=inject(Router);
  filter:PaperFilter;
  paperList:PaperConfig[]=[];
  isDesc=false;
  aToZ:string='A Z';

  constructor(){
    this.filter={
      statusIds: [],
      orderType: "ASC"
    } 
  }

  ngOnInit(): void {
      this.loadPaperConfigList();
  }

  loadPaperConfigList()
  {
    this.paperService.getPaperConfigList(this.filter).subscribe({
        next: (response)=>{
          if(response.status && response.data)
          {
            this.paperList=response.data;
            console.log('paper List',this.paperList);
          }
        },error:(error)=>{
          console.log('error',error);
        }
      });
  }

  getStatusClass(status: string): string {
    if (status.toLowerCase().includes('approved')) {
      return 'status-green';
    } else if (status.toLowerCase().includes('waiting')) {
      return 'status-blue';
    } else {
      return 'status-red';
    }
  }

  isDisabled(status: string): boolean {
    return status.toLowerCase().includes('approved');
  }

  togalOrder(){
    this.isDesc=!this.isDesc;
    this.aToZ=this.aToZ.split('').reverse().join('');
    const order=this.filter.orderType;
    if('ASC'===order)
    {
      this.filter.orderType='DESC';
    }else{
      this.filter.orderType='ASC';
    }
    this.loadPaperConfigList();
  }


  private readonly _mdlSvc = inject(NgbModal);

  public paperListData: any = [
    {
      value: '/approach-to-market',
      label: 'Approach to Market'
    },
    {
      value: '/contract-award',
      label: 'Contact Award'
    },
    {
      value: '/contract-variation-or-amendment-approval',
      label: 'Variation Paper'
    },
    {
      value: '/approval-of-sale-disposal-form',
      label: 'Approval of Sale / Disposal Form'
    },
    {
      value: '/info-note',
      label: 'Info note'
    }
  ];

  open(event: any, content: TemplateRef<any>) {
    event.preventDefault();
    this._mdlSvc.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then(
      (result) => {

      },
      (reason) => {

      },
    );
  }

  openPage(value: any, modal: any) {
    this.router.navigate([value.value]);
    modal.close('Save click')
  }
}
