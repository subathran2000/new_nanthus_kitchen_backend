import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../../common/entities/base.entity";
import { MenuItem } from "./menu-item.entity";
import { MeasurementType } from "./measurement-type.entity";

@Entity("menu_item_measurements")
export class MenuItemMeasurement extends BaseEntity {
  @Column({ name: "menu_item_id" })
  menuItemId: string;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.measurements, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "menu_item_id" })
  menuItem: MenuItem;

  @Column({ name: "measurement_type_id" })
  measurementTypeId: string;

  @ManyToOne(() => MeasurementType, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "measurement_type_id" })
  measurementType: MeasurementType;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;
}
