"use client";

import { Checkbox, DatePicker, Input, Select, SelectItem, Textarea } from "@heroui/react";
import type { ComponentPropsWithoutRef } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";

// --- FormInput ---

type FormInputProps<T extends FieldValues> = {
  name: FieldPath<T>;
  control: Control<T>;
} & Omit<
  ComponentPropsWithoutRef<typeof Input>,
  "value" | "onValueChange" | "isInvalid" | "errorMessage"
>;

export function FormInput<T extends FieldValues>({ name, control, ...props }: FormInputProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Input
          {...props}
          value={field.value}
          onValueChange={field.onChange}
          onBlur={field.onBlur}
          isInvalid={!!fieldState.error}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}

// --- FormSelect ---

type SelectOption = { value: string; label: string };

type FormSelectProps<T extends FieldValues> = {
  name: FieldPath<T>;
  control: Control<T>;
  options: SelectOption[];
  onValueChange?: (value: string) => void;
} & Omit<
  ComponentPropsWithoutRef<typeof Select>,
  "children" | "selectedKeys" | "onSelectionChange" | "isInvalid" | "errorMessage"
>;

export function FormSelect<T extends FieldValues>({
  name,
  control,
  options,
  onValueChange,
  ...props
}: FormSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Select
          {...props}
          selectedKeys={field.value ? [field.value] : []}
          onSelectionChange={(keys) => {
            const value = [...keys][0]?.toString() ?? "";
            field.onChange(value);
            onValueChange?.(value);
          }}
          isInvalid={!!fieldState.error}
          errorMessage={fieldState.error?.message}
        >
          {options.map((opt) => (
            <SelectItem key={opt.value}>{opt.label}</SelectItem>
          ))}
        </Select>
      )}
    />
  );
}

// --- FormDatePicker ---

type FormDatePickerProps<T extends FieldValues> = {
  name: FieldPath<T>;
  control: Control<T>;
} & Omit<
  ComponentPropsWithoutRef<typeof DatePicker>,
  "value" | "onChange" | "isInvalid" | "errorMessage"
>;

export function FormDatePicker<T extends FieldValues>({
  name,
  control,
  ...props
}: FormDatePickerProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <DatePicker
          {...props}
          value={field.value}
          onChange={field.onChange}
          isInvalid={!!fieldState.error}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}

// --- FormCheckbox ---

type FormCheckboxProps<T extends FieldValues> = {
  name: FieldPath<T>;
  control: Control<T>;
  children?: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<typeof Checkbox>, "isSelected" | "onValueChange" | "children">;

export function FormCheckbox<T extends FieldValues>({
  name,
  control,
  children,
  ...props
}: FormCheckboxProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Checkbox
          {...props}
          isSelected={!!field.value}
          onValueChange={field.onChange}
          onBlur={field.onBlur}
        >
          {children}
        </Checkbox>
      )}
    />
  );
}

// --- FormTextarea ---

type FormTextareaProps<T extends FieldValues> = {
  name: FieldPath<T>;
  control: Control<T>;
} & Omit<
  ComponentPropsWithoutRef<typeof Textarea>,
  "value" | "onValueChange" | "isInvalid" | "errorMessage"
>;

export function FormTextarea<T extends FieldValues>({
  name,
  control,
  ...props
}: FormTextareaProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Textarea
          {...props}
          value={field.value}
          onValueChange={field.onChange}
          isInvalid={!!fieldState.error}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}
