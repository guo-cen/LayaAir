import { Vector3 } from "../math/Vector3";
import { Physics3DUtils } from "../utils/Physics3DUtils";
import { Utils3D } from "../utils/Utils3D";
import { PhysicsComponent } from "./PhysicsComponent";
import { Physics3D } from "./Physics3D";
import { ColliderShape } from "./shape/ColliderShape";
import { Component } from "../../components/Component";

/**
 * <code>CharacterController</code> 类用于创建角色控制器。
 */
export class CharacterController extends PhysicsComponent {
	/** @internal */
	private static _nativeTempVector30: number;

	/**
	 * @internal
	 */
	static __init__(): void {
		CharacterController._nativeTempVector30 = Physics3D._bullet.btVector3_create(0, 0, 0);
	}

	/* UP轴_X轴。*/
	static UPAXIS_X: number = 0;
	/* UP轴_Y轴。*/
	static UPAXIS_Y: number = 1;
	/* UP轴_Z轴。*/
	static UPAXIS_Z: number = 2;

	/** @internal */
	private _stepHeight: number;
	/** @internal */
	private _upAxis: Vector3 = new Vector3(0, 1, 0);
	/**@internal */
	private _maxSlope: number = 45.0;
	/**@internal */
	private _jumpSpeed: number = 10.0;
	/**@internal */
	private _fallSpeed: number = 55.0;
	/** @internal */
	private _gravity: Vector3 = new Vector3(0, -9.8 * 3, 0);

	/**@internal */
	_nativeKinematicCharacter: number = null;

	/**
	 * 角色降落速度。
	 */
	get fallSpeed(): number {
		return this._fallSpeed;
	}

	set fallSpeed(value: number) {
		this._fallSpeed = value;
		Physics3D._bullet.btKinematicCharacterController_setFallSpeed(this._nativeKinematicCharacter, value);
	}

	/**
	 * 角色跳跃速度。
	 */
	get jumpSpeed(): number {
		return this._jumpSpeed;
	}

	set jumpSpeed(value: number) {
		this._jumpSpeed = value;
		Physics3D._bullet.btKinematicCharacterController_setJumpSpeed(this._nativeKinematicCharacter, value);
	}

	/**
	 * 重力。
	 */
	get gravity(): Vector3 {
		return this._gravity;
	}

	set gravity(value: Vector3) {
		this._gravity = value;
		var bullet: any = Physics3D._bullet;
		var nativeGravity: number = CharacterController._nativeTempVector30;
		bullet.btVector3_setValue(nativeGravity, -value.x, value.y, value.z);
		bullet.btKinematicCharacterController_setGravity(this._nativeKinematicCharacter, nativeGravity);
	}

	/**
	 * 最大坡度。
	 */
	get maxSlope(): number {
		return this._maxSlope;
	}

	set maxSlope(value: number) {
		this._maxSlope = value;
		Physics3D._bullet.btKinematicCharacterController_setMaxSlope(this._nativeKinematicCharacter, (value / 180) * Math.PI);
	}

	/**
	 * 角色是否在地表。
	 */
	get isGrounded(): boolean {
		return Physics3D._bullet.btKinematicCharacterController_onGround(this._nativeKinematicCharacter);
	}

	/**
	 * 角色行走的脚步高度，表示可跨越的最大高度。
	 */
	get stepHeight(): number {
		return this._stepHeight;
	}

	set stepHeight(value: number) {
		this._stepHeight = value;
		this._constructCharacter();
	}

	/**
	 * 角色的Up轴。
	 */
	get upAxis(): Vector3 {
		return this._upAxis;
	}

	set upAxis(value: Vector3) {
		this._upAxis = value;
		this._constructCharacter();
	}

	/**
	 * 创建一个 <code>CharacterController</code> 实例。
	 * @param stepheight 角色脚步高度。
	 * @param upAxis 角色Up轴
	 * @param collisionGroup 所属碰撞组。
	 * @param canCollideWith 可产生碰撞的碰撞组。
	 */
	constructor(stepheight: number = 0.1, upAxis: Vector3 = null, collisionGroup: number = Physics3DUtils.COLLISIONFILTERGROUP_DEFAULTFILTER, canCollideWith: number = Physics3DUtils.COLLISIONFILTERGROUP_ALLFILTER) {
		super(collisionGroup, canCollideWith);
		this._stepHeight = stepheight;
		(upAxis) && (this._upAxis = upAxis);
	}

	/**
	 * @internal
	 */
	private _constructCharacter(): void {
		var bullet: any = Physics3D._bullet;
		if (this._nativeKinematicCharacter)
			bullet.destroy(this._nativeKinematicCharacter);

		var nativeUpAxis: number = CharacterController._nativeTempVector30;
		bullet.btVector3_setValue(nativeUpAxis, this._upAxis.x, this._upAxis.y, this._upAxis.z);
		this._nativeKinematicCharacter = bullet.btKinematicCharacterController_create(this._nativeColliderObject, this._colliderShape._nativeShape, this._stepHeight, nativeUpAxis);
		this.fallSpeed = this._fallSpeed;
		this.maxSlope = this._maxSlope;
		this.jumpSpeed = this._jumpSpeed;
		this.gravity = this._gravity;
	}

	/**
	 * @inheritDoc
	 * @override
	 * @internal
	 */
	_onShapeChange(colShape: ColliderShape): void {
		super._onShapeChange(colShape);
		this._constructCharacter();
	}

	/**
	 * @inheritDoc
	 * @override
	 * @internal
	 */
	_onAdded(): void {
		var bullet: any = Physics3D._bullet;
		var ghostObject: number = bullet.btPairCachingGhostObject_create();
		bullet.btCollisionObject_setUserIndex(ghostObject, this.id);
		bullet.btCollisionObject_setCollisionFlags(ghostObject, PhysicsComponent.COLLISIONFLAGS_CHARACTER_OBJECT);
		this._nativeColliderObject = ghostObject;

		if (this._colliderShape)
			this._constructCharacter();
		super._onAdded();
	}

	/**
	 * @inheritDoc
	 * @override
	 * @internal
	 */
	_addToSimulation(): void {
		this._simulation._characters.push(this);
		this._simulation._addCharacter(this, this._collisionGroup, this._canCollideWith);
	}

	/**
	 * @inheritDoc
	 * @override
	 * @internal
	 */
	_removeFromSimulation(): void {
		this._simulation._removeCharacter(this);
		var characters: CharacterController[] = this._simulation._characters;
		characters.splice(characters.indexOf(this), 1);
	}

	/**
	 * @inheritDoc
	 * @override
	 * @internal
	 */
	_cloneTo(dest: Component): void {
		super._cloneTo(dest);
		var destCharacterController: CharacterController = (<CharacterController>dest);
		destCharacterController.stepHeight = this._stepHeight;
		destCharacterController.upAxis = this._upAxis;
		destCharacterController.maxSlope = this._maxSlope;
		destCharacterController.jumpSpeed = this._jumpSpeed;
		destCharacterController.fallSpeed = this._fallSpeed;
		destCharacterController.gravity = this._gravity;
	}

	/**
	 * @inheritDoc
	 * @internal
	 * @override
	 */
	protected _onDestroy(): void {
		Physics3D._bullet.destroy(this._nativeKinematicCharacter);
		super._onDestroy();
		this._nativeKinematicCharacter = null;
	}

	/**
	 * 通过指定移动向量移动角色。
	 * @param	movement 移动向量。
	 */
	move(movement: Vector3): void {
		var nativeMovement: number = CharacterController._nativeVector30;
		var bullet: any = Physics3D._bullet;
		bullet.btVector3_setValue(nativeMovement, -movement.x, movement.y, movement.z);
		bullet.btKinematicCharacterController_setWalkDirection(this._nativeKinematicCharacter, nativeMovement);
	}

	/**
	 * 跳跃。
	 * @param velocity 跳跃速度。
	 */
	jump(velocity: Vector3 = null): void {
		var bullet: any = Physics3D._bullet;
		if (velocity) {
			var nativeVelocity: number = CharacterController._nativeVector30;
			Utils3D._convertToBulletVec3(velocity, nativeVelocity, true);
			bullet.btKinematicCharacterController_jump(this._nativeKinematicCharacter, nativeVelocity);
		} else {
			var nativeVelocity: number = CharacterController._nativeVector30;
			bullet.btVector3_setValue(nativeVelocity, 0, 0, 0);
			bullet.btKinematicCharacterController_jump(this._nativeKinematicCharacter, nativeVelocity);
		}
	}
}

