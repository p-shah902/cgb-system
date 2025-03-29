import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { PaperConfigService } from '../../service/paper/paper-config.service';
import { PaperFilter } from '../../models/general';
import { PaperConfig } from '../../models/paper';

@Component({
  selector: 'app-paperconfiguration',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paperconfiguration.component.html',
  styleUrl: './paperconfiguration.component.scss'
})
export class PaperconfigurationComponent implements OnInit{

  private paperService=inject(PaperConfigService);
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

}
